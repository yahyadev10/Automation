package com.leadflowai.leadflow.emaildraft;

import com.leadflowai.leadflow.common.PageResponse;
import com.leadflowai.leadflow.security.CurrentUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/email-drafts")
@RequiredArgsConstructor
@Tag(name = "Email drafts", description = "Revue humaine et envoi")
public class EmailDraftController {

    private final EmailDraftService draftService;
    private final CurrentUser currentUser;

    @GetMapping
    @Operation(summary = "Liste paginée des brouillons")
    public PageResponse<DraftResponse> list(
            @RequestParam(required = false) DraftStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable) {
        return draftService.list(status, pageable, currentUser.get());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Détail d'un brouillon")
    public DraftResponse get(@PathVariable UUID id) {
        return draftService.get(id, currentUser.get());
    }

    @PutMapping("/{id}")
    @Operation(summary = "Modifier le contenu avant approbation")
    public DraftResponse update(@PathVariable UUID id, @Valid @RequestBody DraftUpdateRequest request) {
        return draftService.update(id, request, currentUser.get());
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Approuver explicitement le brouillon")
    public DraftResponse approve(@PathVariable UUID id) {
        return draftService.approve(id, currentUser.get());
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Rejeter le brouillon")
    public DraftResponse reject(@PathVariable UUID id) {
        return draftService.reject(id, currentUser.get());
    }

    @PostMapping("/{id}/send")
    @Operation(summary = "Envoyer uniquement si le brouillon est approuvé")
    public SendResponse send(@PathVariable UUID id) {
        return draftService.send(id, currentUser.get());
    }
}
