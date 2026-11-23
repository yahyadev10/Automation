package com.leadflowai.leadflow.emaildraft;

import java.util.UUID;

public record SendResponse(UUID draftId, String status, boolean simulated, String message) {
}
