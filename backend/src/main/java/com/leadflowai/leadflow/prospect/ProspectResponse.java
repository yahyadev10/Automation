package com.leadflowai.leadflow.prospect;

import java.time.Instant;
import java.util.UUID;

public record ProspectResponse(
        UUID id,
        String companyName,
        String contactName,
        String email,
        String website,
        String industry,
        String companyDescription,
        ProspectSource source,
        ProspectStatus status,
        Instant createdAt,
        Instant updatedAt
) {
}
