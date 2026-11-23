package com.leadflowai.leadflow.emaildraft;

import com.leadflowai.leadflow.automation.TriggerResponse;
import com.leadflowai.leadflow.security.CurrentUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/prospects")
@RequiredArgsConstructor
@Tag(name = "Email drafts", description = "Génération des brouillons")
public class EmailGenerationController {

    private final EmailDraftService draftService;
    private final CurrentUser currentUser;

    @PostMapping("/{id}/email-drafts/generate")
    @Operation(summary = "Générer un brouillon via n8n (jamais envoyé automatiquement)")
    public ResponseEntity<TriggerResponse> generate(@PathVariable UUID id) {
        return ResponseEntity.accepted().body(draftService.generate(id, currentUser.get()));
    }
}
