package com.leadflowai.leadflow.emaildraft;

import com.leadflowai.leadflow.activity.ActivityService;
import com.leadflowai.leadflow.activity.EventType;
import com.leadflowai.leadflow.automation.AutomationClient;
import com.leadflowai.leadflow.automation.AutomationDispatcher;
import com.leadflowai.leadflow.automation.AutomationRun;
import com.leadflowai.leadflow.automation.AutomationRunRepository;
import com.leadflowai.leadflow.automation.EmailCallbackRequest;
import com.leadflowai.leadflow.automation.EmailDraftPayload;
import com.leadflowai.leadflow.automation.EmailSendPayload;
import com.leadflowai.leadflow.automation.TriggerResponse;
import com.leadflowai.leadflow.common.ApiException;
import com.leadflowai.leadflow.common.Mappers;
import com.leadflowai.leadflow.common.PageResponse;
import com.leadflowai.leadflow.prospect.Prospect;
import com.leadflowai.leadflow.prospect.ProspectService;
import com.leadflowai.leadflow.qualification.QualificationAnalysis;
import com.leadflowai.leadflow.qualification.QualificationAnalysisRepository;
import com.leadflowai.leadflow.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class EmailDraftService {

    private final EmailDraftRepository repository;
    private final QualificationAnalysisRepository analysisRepository;
    private final AutomationRunRepository runRepository;
    private final ProspectService prospectService;
    private final AutomationClient automationClient;
    private final AutomationDispatcher dispatcher;
    private final ActivityService activityService;

    @Value("${app.email-provider}")
    private String emailProvider;

    public TriggerResponse generate(UUID prospectId, User user) {
        Prospect prospect = prospectService.findOwned(prospectId, user);
        QualificationAnalysis analysis = analysisRepository
                .findFirstByProspectIdOrderByCreatedAtDesc(prospectId)
                .orElseThrow(() -> ApiException.conflict("Qualification analysis is required before drafting"));
        UUID correlationId = UUID.randomUUID();
        runRepository.save(newRun(correlationId, AutomationRun.RunType.EMAIL_DRAFT, prospectId, null));
        activityService.record(prospectId, user.getId(), EventType.EMAIL_DRAFT_REQUESTED,
                "Email draft requested for " + prospect.getCompanyName(),
                Map.of("correlationId", correlationId.toString()));
        EmailDraftPayload payload = new EmailDraftPayload(
                correlationId, prospectId, prospect.getCompanyName(), prospect.getContactName(),
                prospect.getEmail(), prospect.getIndustry(), prospect.getCompanyDescription(),
                analysis.getScore(), analysis.getCategory().name(), analysis.getSummary(),
                analysis.getRecommendations(), analysis.getMissingInformation());
        dispatcher.afterCommit(() -> {
            try {
                automationClient.requestEmailDraft(payload);
            } catch (ApiException ex) {
                failRun(correlationId, ex.getMessage());
            }
        });
        return new TriggerResponse(correlationId, "PENDING", "Draft generation started.");
    }

    public void handleCallback(EmailCallbackRequest request) {
        AutomationRun run = runRepository.findByCorrelationId(request.correlationId())
                .orElseThrow(() -> ApiException.badRequest("Unknown correlationId"));
        if (run.getStatus() != AutomationRun.RunStatus.PENDING) {
            return;
        }
        if (request.isDraftKind()) {
            handleDraftResult(request, run);
        } else {
            handleSendResult(request, run);
        }
    }

    private void handleDraftResult(EmailCallbackRequest request, AutomationRun run) {
        String subject = request.subject();
        String body = request.body();
        if (!request.isSuccess() || subject == null || subject.isBlank()
                || body == null || body.isBlank()) {
            failRun(request.correlationId(), request.errorMessage());
            activityService.record(run.getProspectId(), null, EventType.AUTOMATION_ERROR,
                    "Email draft generation failed", Map.of("correlationId", request.correlationId().toString()));
            return;
        }
        Prospect prospect = prospectService.findActive(run.getProspectId());
        EmailDraft draft = EmailDraft.builder()
                .id(UUID.randomUUID())
                .prospect(prospect)
                .correlationId(request.correlationId())
                .subject(trim(subject, 300))
                .body(body)
                .status(DraftStatus.PENDING_REVIEW)
                .build();
        repository.save(draft);
        run.setStatus(AutomationRun.RunStatus.COMPLETED);
        run.setDraftId(draft.getId());
        runRepository.save(run);
        activityService.record(prospect.getId(), null, EventType.EMAIL_DRAFT_CREATED,
                "Email draft created and waiting for human review",
                Map.of("draftId", draft.getId().toString()));
    }

    private void handleSendResult(EmailCallbackRequest request, AutomationRun run) {
        EmailDraft draft = repository.findById(run.getDraftId())
                .orElseThrow(() -> ApiException.notFound("Draft not found"));
        run.setStatus(request.isSuccess() ? AutomationRun.RunStatus.COMPLETED : AutomationRun.RunStatus.FAILED);
        run.setErrorMessage(request.isSuccess() ? null : clean(request.errorMessage()));
        runRepository.save(run);
        if (request.isSuccess()) {
            draft.setStatus(DraftStatus.SENT);
            draft.setSentAt(Instant.now());
            boolean simulated = Boolean.TRUE.equals(request.simulated());
            activityService.record(draft.getProspect().getId(), null,
                    simulated ? EventType.EMAIL_SENT_SIMULATED : EventType.EMAIL_SENT,
                    simulated ? "Email send simulated (no real delivery)" : "Email sent",
                    Map.of("draftId", draft.getId().toString(), "simulated", simulated));
        } else {
            draft.setStatus(DraftStatus.FAILED);
            activityService.record(draft.getProspect().getId(), null, EventType.EMAIL_SEND_FAILED,
                    "Email send failed", Map.of("draftId", draft.getId().toString()));
        }
        repository.save(draft);
    }

    public PageResponse<DraftResponse> list(DraftStatus status, Pageable pageable, User user) {
        if (status == null) {
            return PageResponse.from(repository.findAll(pageable).map(Mappers::toDraft));
        }
        return PageResponse.from(repository.findByStatusOrderByCreatedAtDesc(status, pageable)
                .map(Mappers::toDraft));
    }

    public DraftResponse get(UUID id, User user) {
        return Mappers.toDraft(findOwned(id, user));
    }

    public DraftResponse update(UUID id, DraftUpdateRequest request, User user) {
        EmailDraft draft = findOwned(id, user);
        requireStatus(draft, DraftStatus.PENDING_REVIEW, "Only a pending draft can be edited");
        draft.setSubject(request.subject().trim());
        draft.setBody(request.body().trim());
        repository.save(draft);
        activityService.record(draft.getProspect().getId(), user.getId(), EventType.EMAIL_DRAFT_UPDATED,
                "Draft content edited before approval", Map.of("draftId", id.toString()));
        return Mappers.toDraft(draft);
    }

    public DraftResponse approve(UUID id, User user) {
        EmailDraft draft = findOwned(id, user);
        requireStatus(draft, DraftStatus.PENDING_REVIEW, "Only a pending draft can be approved");
        draft.setStatus(DraftStatus.APPROVED);
        draft.setApprovedAt(Instant.now());
        draft.setApprovedBy(user.getId());
        repository.save(draft);
        activityService.record(draft.getProspect().getId(), user.getId(), EventType.EMAIL_DRAFT_APPROVED,
                "Draft explicitly approved by " + user.getEmail(), Map.of("draftId", id.toString()));
        return Mappers.toDraft(draft);
    }

    public DraftResponse reject(UUID id, User user) {
        EmailDraft draft = findOwned(id, user);
        requireStatus(draft, DraftStatus.PENDING_REVIEW, "Only a pending draft can be rejected");
        draft.setStatus(DraftStatus.REJECTED);
        repository.save(draft);
        activityService.record(draft.getProspect().getId(), user.getId(), EventType.EMAIL_DRAFT_REJECTED,
                "Draft rejected by " + user.getEmail(), Map.of("draftId", id.toString()));
        return Mappers.toDraft(draft);
    }

    public SendResponse send(UUID id, User user) {
        EmailDraft draft = findOwned(id, user);
        requireStatus(draft, DraftStatus.APPROVED, "Draft must be approved before sending");
        if (runRepository.existsByDraftIdAndAutomationTypeAndStatus(
                id, AutomationRun.RunType.EMAIL_SEND, AutomationRun.RunStatus.PENDING)) {
            throw ApiException.conflict("A send operation is already pending for this draft");
        }
        UUID correlationId = UUID.randomUUID();
        runRepository.save(newRun(correlationId, AutomationRun.RunType.EMAIL_SEND,
                draft.getProspect().getId(), id));
        activityService.record(draft.getProspect().getId(), user.getId(), EventType.EMAIL_SEND_REQUESTED,
                "Approved draft explicitly sent by " + user.getEmail(),
                Map.of("draftId", id.toString(), "correlationId", correlationId.toString()));
        EmailSendPayload payload = new EmailSendPayload(
                correlationId, id, draft.getProspect().getId(), draft.getProspect().getEmail(),
                draft.getSubject(), draft.getBody(), emailProvider);
        dispatcher.afterCommit(() -> {
            try {
                automationClient.requestEmailSend(payload);
            } catch (ApiException ex) {
                failRun(correlationId, ex.getMessage());
                draft.setStatus(DraftStatus.FAILED);
                repository.save(draft);
                activityService.record(draft.getProspect().getId(), user.getId(), EventType.EMAIL_SEND_FAILED,
                        "Email send could not be started",
                        Map.of("draftId", id.toString(), "correlationId", correlationId.toString()));
            }
        });
        return new SendResponse(id, "PENDING", isSimulation(),
                isSimulation() ? "Send simulated by n8n (no real email delivered)" : "Send requested");
    }

    public boolean isSimulation() {
        return emailProvider == null || emailProvider.isBlank()
                || "console".equalsIgnoreCase(emailProvider);
    }

    private AutomationRun newRun(UUID correlationId, AutomationRun.RunType type,
                                 UUID prospectId, UUID draftId) {
        return AutomationRun.builder()
                .id(UUID.randomUUID())
                .correlationId(correlationId)
                .automationType(type)
                .prospectId(prospectId)
                .draftId(draftId)
                .status(AutomationRun.RunStatus.PENDING)
                .build();
    }

    private void failRun(UUID correlationId, String message) {
        runRepository.findByCorrelationId(correlationId).ifPresent(run -> {
            run.setStatus(AutomationRun.RunStatus.FAILED);
            run.setErrorMessage(clean(message));
            runRepository.save(run);
        });
    }

    private void requireStatus(EmailDraft draft, DraftStatus expected, String message) {
        if (draft.getStatus() != expected) {
            throw ApiException.conflict(message);
        }
    }

    private EmailDraft findOwned(UUID id, User user) {
        EmailDraft draft = repository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Draft not found"));
        if (!draft.getProspect().getOwner().getId().equals(user.getId())) {
            throw ApiException.notFound("Draft not found");
        }
        return draft;
    }

    private String clean(String value) {
        if (value == null) return "unspecified error";
        return value.length() > 500 ? value.substring(0, 500) : value;
    }

    private String trim(String value, int max) {
        return value.length() > max ? value.substring(0, max) : value;
    }
}
