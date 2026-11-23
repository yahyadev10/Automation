package com.leadflowai.leadflow.automation;

import java.util.UUID;

public record TriggerResponse(UUID correlationId, String status, String message) {
}
