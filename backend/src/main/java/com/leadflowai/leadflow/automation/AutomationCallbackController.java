package com.leadflowai.leadflow.automation;

import com.leadflowai.leadflow.emaildraft.EmailDraftService;
import com.leadflowai.leadflow.qualification.QualificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/automation/callbacks")
@RequiredArgsConstructor
@Tag(name = "Automation callbacks", description = "Callbacks n8n sécurisés par secret partagé")
public class AutomationCallbackController {

    private final WebhookSecretValidator secretValidator;
    private final QualificationService qualificationService;
    private final EmailDraftService draftService;

    @PostMapping("/qualification")
    @Operation(summary = "Résultat de qualification renvoyé par n8n")
    public Map<String, String> qualification(
            @RequestHeader(value = "X-LeadFlow-Secret", required = false) String secret,
            @Valid @RequestBody QualificationCallbackRequest request) {
        secretValidator.requireValid(secret);
        qualificationService.handleCallback(request);
        return Map.of("status", "accepted");
    }

    @PostMapping("/email")
    @Operation(summary = "Résultat de génération ou d'envoi renvoyé par n8n")
    public Map<String, String> email(
            @RequestHeader(value = "X-LeadFlow-Secret", required = false) String secret,
            @Valid @RequestBody EmailCallbackRequest request) {
        secretValidator.requireValid(secret);
        draftService.handleCallback(request);
        return Map.of("status", "accepted");
    }

    @PostMapping("/error")
    @Operation(summary = "Erreur centralisée renvoyée par WF-04")
    public Map<String, String> error(
            @RequestHeader(value = "X-LeadFlow-Secret", required = false) String secret,
            @Valid @RequestBody AutomationErrorRequest request) {
        secretValidator.requireValid(secret);
        qualificationService.handleAutomationError(request, request.correlationId());
        return Map.of("status", "accepted");
    }
}
