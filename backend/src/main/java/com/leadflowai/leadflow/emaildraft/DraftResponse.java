package com.leadflowai.leadflow.emaildraft;

import java.time.Instant;
import java.util.UUID;

public record DraftResponse(
        UUID id,
        UUID prospectId,
        String subject,
        String body,
        DraftStatus status,
        Instant approvedAt,
        Instant sentAt,
        Instant createdAt,
        Instant updatedAt
) {
}
