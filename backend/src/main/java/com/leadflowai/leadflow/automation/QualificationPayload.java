package com.leadflowai.leadflow.automation;

import java.util.UUID;

public record QualificationPayload(
        UUID correlationId,
        UUID prospectId,
        String companyName,
        String contactName,
        String email,
        String website,
        String industry,
        String companyDescription,
        String source,
        String promptVersion
) {
}
