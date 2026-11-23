package com.leadflowai.leadflow.prospect;

import com.leadflowai.leadflow.automation.TriggerResponse;
import com.leadflowai.leadflow.common.Mappers;
import com.leadflowai.leadflow.common.PageResponse;
import com.leadflowai.leadflow.qualification.AnalysisResponse;
import com.leadflowai.leadflow.qualification.QualificationAnalysisRepository;
import com.leadflowai.leadflow.qualification.QualificationService;
import com.leadflowai.leadflow.security.CurrentUser;
import com.leadflowai.leadflow.user.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
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
@RequestMapping("/api/v1/prospects")
@RequiredArgsConstructor
@Tag(name = "Prospects", description = "Gestion des prospects")
public class ProspectController {

    private final ProspectService prospectService;
    private final QualificationService qualificationService;
    private final QualificationAnalysisRepository analysisRepository;
    private final CurrentUser currentUser;

    @GetMapping
    @Operation(summary = "Liste paginée, recherchable et filtrable")
    public PageResponse<ProspectResponse> list(
            @RequestParam(required = false) ProspectStatus status,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable) {
        return prospectService.list(status, search, pageable, currentUser.get());
    }

    @PostMapping
    @Operation(summary = "Créer un prospect")
    public ResponseEntity<ProspectResponse> create(@Valid @RequestBody ProspectCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(prospectService.create(request, currentUser.get()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Détail du prospect avec analyses, brouillons et activité")
    public ProspectDetailResponse detail(@PathVariable UUID id) {
        return prospectService.detail(id, currentUser.get());
    }

    @PutMapping("/{id}")
    @Operation(summary = "Modifier un prospect")
    public ProspectResponse update(@PathVariable UUID id,
                                   @Valid @RequestBody ProspectUpdateRequest request) {
        return prospectService.update(id, request, currentUser.get());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Archiver un prospect (suppression logique)")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        prospectService.delete(id, currentUser.get());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/qualify")
    @Operation(summary = "Déclencher la qualification IA via n8n")
    public ResponseEntity<TriggerResponse> qualify(@PathVariable UUID id) {
        return ResponseEntity.accepted().body(qualificationService.trigger(id, currentUser.get()));
    }

    @GetMapping("/{id}/analyses")
    @Operation(summary = "Historique des analyses")
    public PageResponse<AnalysisResponse> analyses(
            @PathVariable UUID id,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable) {
        User user = currentUser.get();
        prospectService.findOwned(id, user);
        return PageResponse.from(analysisRepository.findByProspectIdOrderByCreatedAtDesc(id, pageable)
                .map(Mappers::toAnalysis));
    }
}
