package com.leadflowai.leadflow.automation;

import java.util.UUID;

public record EmailSendPayload(
        UUID correlationId,
        UUID draftId,
        UUID prospectId,
        String recipient,
        String subject,
        String body,
        String provider
) {
}
