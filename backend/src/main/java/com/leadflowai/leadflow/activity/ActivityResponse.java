package com.leadflowai.leadflow.activity;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record ActivityResponse(
        UUID id,
        UUID prospectId,
        EventType eventType,
        String description,
        Map<String, Object> metadata,
        Instant createdAt
) {
}
