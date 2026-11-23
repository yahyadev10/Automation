package com.leadflowai.leadflow.automation;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record AutomationErrorRequest(
        @NotBlank @Size(max = 120) String workflowName,
        UUID correlationId,
        @Size(max = 120) String executionId,
        @NotBlank @Size(max = 500) String message
) {
}
