package com.leadflowai.leadflow.prospect;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record ProspectUpdateRequest(
        @Size(min = 1, max = 200) String companyName,
        @Size(max = 150) String contactName,
        @Email @Size(max = 255) String email,
        @Size(max = 255) String website,
        @Size(max = 120) String industry,
        @Size(min = 1, max = 4000) String companyDescription
) {
}
