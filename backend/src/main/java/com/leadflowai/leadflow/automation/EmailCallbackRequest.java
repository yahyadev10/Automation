package com.leadflowai.leadflow.automation;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record EmailCallbackRequest(
        @NotNull UUID correlationId,
        UUID draftId,
        UUID prospectId,
        String status,
        String kind,
        String subject,
        String body,
        Boolean simulated,
        String provider,
        String errorMessage
) {
    public boolean isSuccess() {
        return "SUCCESS".equalsIgnoreCase(status);
    }

    public boolean isDraftKind() {
        return kind == null || "DRAFT".equalsIgnoreCase(kind);
    }
}
