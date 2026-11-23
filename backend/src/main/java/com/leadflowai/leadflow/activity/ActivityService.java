package com.leadflowai.leadflow.activity;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ActivityService {

    private final ActivityEventRepository repository;

    public ActivityEvent record(UUID prospectId, UUID userId, EventType type,
                                String description, Map<String, Object> metadata) {
        return repository.save(ActivityEvent.builder()
                .id(UUID.randomUUID())
                .prospectId(prospectId)
                .userId(userId)
                .eventType(type)
                .description(description)
                .metadata(metadata == null ? Map.of() : metadata)
                .build());
    }
}
