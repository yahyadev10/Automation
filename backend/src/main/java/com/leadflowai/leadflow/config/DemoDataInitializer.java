package com.leadflowai.leadflow.config;

import com.leadflowai.leadflow.activity.ActivityEvent;
import com.leadflowai.leadflow.activity.ActivityEventRepository;
import com.leadflowai.leadflow.activity.EventType;
import com.leadflowai.leadflow.emaildraft.DraftStatus;
import com.leadflowai.leadflow.emaildraft.EmailDraft;
import com.leadflowai.leadflow.emaildraft.EmailDraftRepository;
import com.leadflowai.leadflow.prospect.Prospect;
import com.leadflowai.leadflow.prospect.ProspectRepository;
import com.leadflowai.leadflow.prospect.ProspectSource;
import com.leadflowai.leadflow.prospect.ProspectStatus;
import com.leadflowai.leadflow.qualification.ConfidenceLevel;
import com.leadflowai.leadflow.qualification.QualificationAnalysis;
import com.leadflowai.leadflow.qualification.QualificationAnalysisRepository;
import com.leadflowai.leadflow.qualification.QualificationCategory;
import com.leadflowai.leadflow.qualification.ScoringRules;
import com.leadflowai.leadflow.security.DemoUserInitializer;
import com.leadflowai.leadflow.user.User;
import com.leadflowai.leadflow.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
@Profile("dev")
@ConditionalOnProperty(name = "app.demo-mode", havingValue = "true")
@Order(2)
@RequiredArgsConstructor
public class DemoDataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataInitializer.class);

    private final UserRepository userRepository;
    private final ProspectRepository prospectRepository;
    private final QualificationAnalysisRepository analysisRepository;
    private final EmailDraftRepository draftRepository;
    private final ActivityEventRepository activityRepository;

    @Override
    public void run(ApplicationArguments args) {
        if (!prospectRepository.findAllDemo().isEmpty()) {
            return;
        }
        User owner = userRepository.findByEmailIgnoreCase(DemoUserInitializer.DEMO_EMAIL)
                .orElseThrow(() -> new IllegalStateException("Demo user missing"));
        create(owner, "Northwind Biotech", "Fictitious company - demo dataset", 88,
                "Clinical-stage biotech with a published Phase II program.", ProspectStatus.QUALIFIED,
                DraftStatus.PENDING_REVIEW);
        create(owner, "Helios Manufacturing", "Fictitious company - demo dataset", 61,
                "Mid-size manufacturer modernizing its quality operations.", ProspectStatus.QUALIFIED,
                null);
        create(owner, "Atlas Logistics", "Fictitious company - demo dataset", 24,
                "Regional logistics provider with no publicly described R&D budget.",
                ProspectStatus.NOT_QUALIFIED, null);
        create(owner, "Meridian Analytics", "Fictitious company - demo dataset", 76,
                "Data analytics SME looking for academic collaborations.", ProspectStatus.QUALIFIED,
                DraftStatus.APPROVED);
        create(owner, "Cobalt Energy", "Fictitious company - demo dataset", 0, null,
                ProspectStatus.NEW, null);
        activityRepository.save(ActivityEvent.builder()
                .id(UUID.randomUUID())
                .eventType(EventType.DEMO_DATA_LOADED)
                .description("Fictitious demo dataset loaded (DEMO_MODE=true)")
                .metadata(Map.of("count", 5, "source", "DEMO"))
                .build());
        log.info("Demo dataset loaded: 5 fictional prospects (source=DEMO)");
    }

    private void create(User owner, String company, String description, int score,
                        String summary, ProspectStatus status, DraftStatus draftStatus) {
        Prospect prospect = prospectRepository.save(Prospect.builder()
                .id(UUID.randomUUID())
                .owner(owner)
                .companyName(company)
                .contactName("Demo Contact")
                .email("contact@example.invalid")
                .industry("Fictitious")
                .companyDescription(description == null ? "Fictitious company - demo dataset" : description)
                .source(ProspectSource.DEMO)
                .status(status)
                .build());
        activityRepository.save(ActivityEvent.builder()
                .id(UUID.randomUUID())
                .prospectId(prospect.getId())
                .userId(owner.getId())
                .eventType(EventType.PROSPECT_CREATED)
                .description("Demo prospect created: " + company)
                .metadata(Map.of("source", "DEMO"))
                .build());
        if (summary != null) {
            QualificationCategory category = ScoringRules.categoryFor(score);
            QualificationAnalysis analysis = analysisRepository.save(QualificationAnalysis.builder()
                    .id(UUID.randomUUID())
                    .prospect(prospect)
                    .score(score)
                    .category(category)
                    .confidence(ConfidenceLevel.MEDIUM)
                    .summary(summary + " Based only on the supplied demo information.")
                    .strengths(List.of("Fictitious example data", "Complete profile supplied"))
                    .weaknesses(List.of("No external verification performed"))
                    .missingInformation(List.of("Budget", "Decision maker", "Timeline"))
                    .recommendations(List.of("Request a discovery call"))
                    .modelName("demo-only-no-llm-call")
                    .promptVersion("demo-v1")
                    .build());
            activityRepository.save(ActivityEvent.builder()
                    .id(UUID.randomUUID())
                    .prospectId(prospect.getId())
                    .eventType(EventType.QUALIFICATION_COMPLETED)
                    .description("Demo qualification: score " + score + ", category " + category)
                    .metadata(Map.of("score", score, "category", category.name(), "demo", true))
                    .build());
            if (draftStatus != null) {
                draftRepository.save(EmailDraft.builder()
                        .id(UUID.randomUUID())
                        .prospect(prospect)
                        .subject("Demo follow-up - " + company)
                        .body("Hello Demo Contact,\n\nThis is a fictitious demo email draft. "
                                + "Based only on the supplied information, a short discovery call "
                                + "could clarify next steps.\n\nRegards,\nLeadFlow AI Demo")
                        .status(draftStatus)
                        .build());
            }
        }
    }
}
