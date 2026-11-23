package com.leadflowai.leadflow.emaildraft;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DraftUpdateRequest(
        @NotBlank @Size(max = 300) String subject,
        @NotBlank @Size(max = 10000) String body
) {
}
