package com.leadflowai.leadflow.automation;

import com.leadflowai.leadflow.common.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Component
public class WebhookSecretValidator {

    private final byte[] expected;

    public WebhookSecretValidator(@Value("${app.webhook-secret}") String secret) {
        if (secret == null || secret.length() < 16) {
            throw new IllegalStateException("N8N_WEBHOOK_SECRET must contain at least 16 characters");
        }
        this.expected = secret.getBytes(StandardCharsets.UTF_8);
    }

    public boolean isValid(String provided) {
        if (provided == null || provided.isBlank()) {
            return false;
        }
        return MessageDigest.isEqual(expected, provided.getBytes(StandardCharsets.UTF_8));
    }

    public void requireValid(String provided) {
        if (!isValid(provided)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_WEBHOOK_SECRET",
                    "Invalid webhook secret");
        }
    }
}
