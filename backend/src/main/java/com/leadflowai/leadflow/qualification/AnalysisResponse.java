package com.leadflowai.leadflow.qualification;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record AnalysisResponse(
        UUID id,
        UUID prospectId,
        UUID correlationId,
        Integer score,
        QualificationCategory category,
        ConfidenceLevel confidence,
        String summary,
        List<String> strengths,
        List<String> weaknesses,
        List<String> missingInformation,
        List<String> recommendations,
        String modelName,
        String promptVersion,
        Instant createdAt
) {
}
