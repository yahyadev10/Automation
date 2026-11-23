package com.leadflowai.leadflow.qualification;

import com.leadflowai.leadflow.activity.ActivityService;
import com.leadflowai.leadflow.activity.EventType;
import com.leadflowai.leadflow.automation.AutomationClient;
import com.leadflowai.leadflow.automation.AutomationDispatcher;
import com.leadflowai.leadflow.automation.AutomationErrorRequest;
import com.leadflowai.leadflow.automation.AutomationRun;
import com.leadflowai.leadflow.automation.AutomationRunRepository;
import com.leadflowai.leadflow.automation.QualificationCallbackRequest;
import com.leadflowai.leadflow.automation.QualificationPayload;
import com.leadflowai.leadflow.automation.TriggerResponse;
import com.leadflowai.leadflow.common.ApiException;
import com.leadflowai.leadflow.prospect.Prospect;
import com.leadflowai.leadflow.prospect.ProspectRepository;
import com.leadflowai.leadflow.prospect.ProspectService;
import com.leadflowai.leadflow.prospect.ProspectStatus;
import com.leadflowai.leadflow.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class QualificationService {

    private final ProspectService prospectService;
    private final ProspectRepository prospectRepository;
    private final QualificationAnalysisRepository analysisRepository;
    private final AutomationRunRepository runRepository;
    private final AutomationClient automationClient;
    private final AutomationDispatcher dispatcher;
    private final ActivityService activityService;

    @Value("${app.prompt-version}")
    private String promptVersion;

    public TriggerResponse trigger(UUID prospectId, User user) {
        Prospect prospect = prospectService.findOwned(prospectId, user);
        UUID correlationId = UUID.randomUUID();
        runRepository.save(AutomationRun.builder()
                .id(UUID.randomUUID())
                .correlationId(correlationId)
                .automationType(AutomationRun.RunType.QUALIFICATION)
                .prospectId(prospectId)
                .status(AutomationRun.RunStatus.PENDING)
                .build());
        prospect.setStatus(ProspectStatus.ANALYZING);
        prospectRepository.save(prospect);
        activityService.record(prospectId, user.getId(), EventType.QUALIFICATION_REQUESTED,
                "AI qualification requested for " + prospect.getCompanyName(),
                Map.of("correlationId", correlationId.toString()));

        QualificationPayload payload = new QualificationPayload(
                correlationId, prospectId, prospect.getCompanyName(), prospect.getContactName(),
                prospect.getEmail(), prospect.getWebsite(), prospect.getIndustry(),
                prospect.getCompanyDescription(), prospect.getSource().name(), promptVersion);
        dispatcher.afterCommit(() -> {
            try {
                automationClient.requestQualification(payload);
            } catch (ApiException ex) {
                failRun(correlationId, prospect, ex.getMessage());
                activityService.record(prospectId, user.getId(), EventType.QUALIFICATION_FAILED,
                        "AI qualification could not be started", Map.of("correlationId", correlationId.toString()));
            }
        });
        return new TriggerResponse(correlationId, "PENDING",
                "Qualification started. Result will arrive via callback.");
    }

    public void handleCallback(QualificationCallbackRequest request) {
        AutomationRun run = runRepository.findByCorrelationId(request.correlationId())
                .orElseThrow(() -> ApiException.badRequest("Unknown correlationId"));
        if (run.getStatus() != AutomationRun.RunStatus.PENDING) {
            return;
        }
        Prospect prospect = prospectRepository.findActiveById(run.getProspectId())
                .orElseThrow(() -> ApiException.notFound("Prospect not found for run"));

        if (!request.isSuccess()) {
            failRun(request.correlationId(), prospect, request.errorMessage());
            activityService.record(prospect.getId(), null, EventType.QUALIFICATION_FAILED,
                    "AI qualification failed", Map.of("correlationId", request.correlationId().toString()));
            return;
        }
        if (request.score() == null || request.summary() == null || request.summary().isBlank()) {
            failRun(request.correlationId(), prospect, "Invalid AI result: missing score or summary");
            activityService.record(prospect.getId(), null, EventType.QUALIFICATION_FAILED,
                    "Invalid AI result received", Map.of("correlationId", request.correlationId().toString()));
            return;
        }

        int score = ScoringRules.clampScore(request.score());
        QualificationCategory category = ScoringRules.categoryFor(score);
        analysisRepository.save(QualificationAnalysis.builder()
                .id(UUID.randomUUID())
                .prospect(prospect)
                .correlationId(request.correlationId())
                .score(score)
                .category(category)
                .confidence(ScoringRules.parseConfidence(request.confidence()))
                .summary(request.summary().trim())
                .strengths(safeList(request.strengths()))
                .weaknesses(safeList(request.weaknesses()))
                .missingInformation(safeList(request.missingInformation()))
                .recommendations(safeList(request.recommendations()))
                .modelName(request.modelName())
                .promptVersion(request.promptVersion())
                .build());
        prospect.setStatus(category == QualificationCategory.LOW
                ? ProspectStatus.NOT_QUALIFIED : ProspectStatus.QUALIFIED);
        prospectRepository.save(prospect);
        run.setStatus(AutomationRun.RunStatus.COMPLETED);
        runRepository.save(run);
        activityService.record(prospect.getId(), null, EventType.QUALIFICATION_COMPLETED,
                "AI qualification completed: score " + score + ", category " + category,
                Map.of("score", score, "category", category.name(),
                        "correlationId", request.correlationId().toString()));
    }

    public void handleAutomationError(AutomationErrorRequest request, UUID correlationId) {
        if (correlationId != null) {
            runRepository.findByCorrelationId(correlationId).ifPresent(run -> {
                if (run.getStatus() == AutomationRun.RunStatus.PENDING) {
                    run.setStatus(AutomationRun.RunStatus.FAILED);
                    run.setErrorMessage(clean(request.message()));
                    runRepository.save(run);
                    prospectRepository.findActiveById(run.getProspectId()).ifPresent(prospect -> {
                        prospect.setStatus(ProspectStatus.ERROR);
                        prospectRepository.save(prospect);
                        activityService.record(prospect.getId(), null, EventType.AUTOMATION_ERROR,
                                "Workflow error: " + request.workflowName(),
                                Map.of("workflow", request.workflowName(),
                                        "correlationId", correlationId.toString()));
                    });
                }
            });
        } else {
            activityService.record(null, null, EventType.AUTOMATION_ERROR,
                    "Workflow error: " + request.workflowName(),
                    Map.of("workflow", request.workflowName(), "executionId", clean(request.executionId())));
        }
    }

    private void failRun(UUID correlationId, Prospect prospect, String message) {
        runRepository.findByCorrelationId(correlationId).ifPresent(run -> {
            run.setStatus(AutomationRun.RunStatus.FAILED);
            run.setErrorMessage(clean(message));
            runRepository.save(run);
        });
        prospect.setStatus(ProspectStatus.ERROR);
        prospectRepository.save(prospect);
    }

    private String clean(String value) {
        if (value == null) return "unspecified error";
        return value.length() > 500 ? value.substring(0, 500) : value;
    }

    private List<String> safeList(List<String> values) {
        if (values == null) return List.of();
        return values.stream()
                .filter(value -> value != null && !value.isBlank())
                .map(value -> value.length() > 500 ? value.substring(0, 500) : value.trim())
                .limit(20)
                .toList();
    }
}
