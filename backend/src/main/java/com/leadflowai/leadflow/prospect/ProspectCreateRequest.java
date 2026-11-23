package com.leadflowai.leadflow.prospect;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProspectCreateRequest(
        @NotBlank @Size(max = 200) String companyName,
        @Size(max = 150) String contactName,
        @Email @Size(max = 255) String email,
        @Size(max = 255) String website,
        @Size(max = 120) String industry,
        @NotBlank @Size(max = 4000) String companyDescription,
        ProspectSource source
) {
}
