package com.leadflowai.leadflow.automation;

import java.util.List;
import java.util.UUID;

public record EmailDraftPayload(
        UUID correlationId,
        UUID prospectId,
        String companyName,
        String contactName,
        String email,
        String industry,
        String companyDescription,
        Integer score,
        String category,
        String analysisSummary,
        List<String> recommendations,
        List<String> missingInformation
) {
}
