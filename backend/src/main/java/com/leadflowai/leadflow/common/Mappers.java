package com.leadflowai.leadflow.common;

import com.leadflowai.leadflow.activity.ActivityEvent;
import com.leadflowai.leadflow.activity.ActivityResponse;
import com.leadflowai.leadflow.emaildraft.DraftResponse;
import com.leadflowai.leadflow.emaildraft.EmailDraft;
import com.leadflowai.leadflow.prospect.Prospect;
import com.leadflowai.leadflow.prospect.ProspectResponse;
import com.leadflowai.leadflow.qualification.QualificationAnalysis;
import com.leadflowai.leadflow.qualification.AnalysisResponse;

import java.util.List;

public final class Mappers {

    private Mappers() {
    }

    public static ProspectResponse toProspect(Prospect p) {
        return new ProspectResponse(p.getId(), p.getCompanyName(), p.getContactName(), p.getEmail(),
                p.getWebsite(), p.getIndustry(), p.getCompanyDescription(), p.getSource(),
                p.getStatus(), p.getCreatedAt(), p.getUpdatedAt());
    }

    public static AnalysisResponse toAnalysis(QualificationAnalysis a) {
        return new AnalysisResponse(a.getId(), a.getProspect().getId(), a.getCorrelationId(),
                a.getScore(), a.getCategory(), a.getConfidence(), a.getSummary(),
                a.getStrengths(), a.getWeaknesses(), a.getMissingInformation(),
                a.getRecommendations(), a.getModelName(), a.getPromptVersion(), a.getCreatedAt());
    }

    public static List<AnalysisResponse> toAnalyses(List<QualificationAnalysis> analyses) {
        return analyses.stream().map(Mappers::toAnalysis).toList();
    }

    public static DraftResponse toDraft(EmailDraft d) {
        return new DraftResponse(d.getId(), d.getProspect().getId(), d.getSubject(), d.getBody(),
                d.getStatus(), d.getApprovedAt(), d.getSentAt(), d.getCreatedAt(), d.getUpdatedAt());
    }

    public static ActivityResponse toActivity(ActivityEvent e) {
        return new ActivityResponse(e.getId(), e.getProspectId(), e.getEventType(),
                e.getDescription(), e.getMetadata(), e.getCreatedAt());
    }
}
