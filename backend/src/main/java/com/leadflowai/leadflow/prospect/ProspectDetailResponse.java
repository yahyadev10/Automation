package com.leadflowai.leadflow.prospect;

import com.leadflowai.leadflow.activity.ActivityResponse;
import com.leadflowai.leadflow.emaildraft.DraftResponse;
import com.leadflowai.leadflow.qualification.AnalysisResponse;

import java.util.List;
import java.util.UUID;

public record ProspectDetailResponse(
        UUID id,
        String companyName,
        String contactName,
        String email,
        String website,
        String industry,
        String companyDescription,
        ProspectSource source,
        ProspectStatus status,
        List<AnalysisResponse> analyses,
        List<DraftResponse> drafts,
        List<ActivityResponse> activity
) {
}
