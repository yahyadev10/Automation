package com.leadflowai.leadflow.automation;

import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record QualificationCallbackRequest(
        @NotNull UUID correlationId,
        UUID prospectId,
        String status,
        Integer score,
        String category,
        String summary,
        List<String> strengths,
        List<String> weaknesses,
        List<String> missingInformation,
        List<String> recommendations,
        String confidence,
        String modelName,
        String promptVersion,
        String errorMessage
) {
    public boolean isSuccess() {
        return "SUCCESS".equalsIgnoreCase(status);
    }
}
