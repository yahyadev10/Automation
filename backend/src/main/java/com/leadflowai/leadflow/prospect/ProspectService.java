package com.leadflowai.leadflow.prospect;

import com.leadflowai.leadflow.activity.ActivityEventRepository;
import com.leadflowai.leadflow.activity.ActivityService;
import com.leadflowai.leadflow.activity.EventType;
import com.leadflowai.leadflow.common.ApiException;
import com.leadflowai.leadflow.common.Mappers;
import com.leadflowai.leadflow.common.PageResponse;
import com.leadflowai.leadflow.emaildraft.EmailDraftRepository;
import com.leadflowai.leadflow.qualification.QualificationAnalysisRepository;
import com.leadflowai.leadflow.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProspectService {

    private final ProspectRepository repository;
    private final ActivityService activityService;
    private final ActivityEventRepository activityRepository;
    private final QualificationAnalysisRepository analysisRepository;
    private final EmailDraftRepository draftRepository;

    @Transactional
    public ProspectResponse create(ProspectCreateRequest request, User owner) {
        Prospect prospect = Prospect.builder()
                .id(UUID.randomUUID())
                .owner(owner)
                .companyName(request.companyName().trim())
                .contactName(blankToNull(request.contactName()))
                .email(blankToNull(request.email()))
                .website(blankToNull(request.website()))
                .industry(blankToNull(request.industry()))
                .companyDescription(request.companyDescription().trim())
                .source(request.source() == null ? ProspectSource.MANUAL : request.source())
                .status(ProspectStatus.NEW)
                .build();
        Prospect saved = repository.save(prospect);
        activityService.record(saved.getId(), owner.getId(), EventType.PROSPECT_CREATED,
                "Prospect created: " + saved.getCompanyName(), Map.of("source", saved.getSource().name()));
        return Mappers.toProspect(saved);
    }

    public PageResponse<ProspectResponse> list(ProspectStatus status, String search,
                                               Pageable pageable, User owner) {
        String normalizedSearch = search == null || search.isBlank()
                ? null
                : "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
        return PageResponse.from(repository.search(owner.getId(), status, normalizedSearch, pageable)
                .map(Mappers::toProspect));
    }

    public ProspectDetailResponse detail(UUID id, User owner) {
        Prospect prospect = findOwned(id, owner);
        return new ProspectDetailResponse(
                prospect.getId(),
                prospect.getCompanyName(),
                prospect.getContactName(),
                prospect.getEmail(),
                prospect.getWebsite(),
                prospect.getIndustry(),
                prospect.getCompanyDescription(),
                prospect.getSource(),
                prospect.getStatus(),
                Mappers.toAnalyses(analysisRepository.findTop10ByProspectIdOrderByCreatedAtDesc(id)),
                draftRepository.findTop20ByProspectIdOrderByCreatedAtDesc(id).stream()
                        .map(Mappers::toDraft).toList(),
                activityRepository.findTop20ByProspectIdOrderByCreatedAtDesc(id).stream()
                        .map(Mappers::toActivity).toList()
        );
    }

    @Transactional
    public ProspectResponse update(UUID id, ProspectUpdateRequest request, User owner) {
        Prospect prospect = findOwned(id, owner);
        if (request.companyName() != null) prospect.setCompanyName(request.companyName().trim());
        if (request.contactName() != null) prospect.setContactName(blankToNull(request.contactName()));
        if (request.email() != null) prospect.setEmail(blankToNull(request.email()));
        if (request.website() != null) prospect.setWebsite(blankToNull(request.website()));
        if (request.industry() != null) prospect.setIndustry(blankToNull(request.industry()));
        if (request.companyDescription() != null) {
            prospect.setCompanyDescription(request.companyDescription().trim());
        }
        Prospect saved = repository.save(prospect);
        activityService.record(id, owner.getId(), EventType.PROSPECT_UPDATED,
                "Prospect updated: " + saved.getCompanyName(), Map.of());
        return Mappers.toProspect(saved);
    }

    @Transactional
    public void delete(UUID id, User owner) {
        Prospect prospect = findOwned(id, owner);
        prospect.setDeletedAt(Instant.now());
        repository.save(prospect);
        activityService.record(id, owner.getId(), EventType.PROSPECT_DELETED,
                "Prospect archived: " + prospect.getCompanyName(), Map.of("softDelete", true));
    }

    public Prospect findActive(UUID id) {
        return repository.findActiveById(id)
                .orElseThrow(() -> ApiException.notFound("Prospect not found"));
    }

    public Prospect findOwned(UUID id, User owner) {
        Prospect prospect = repository.findActiveById(id)
                .orElseThrow(() -> ApiException.notFound("Prospect not found"));
        if (!prospect.getOwner().getId().equals(owner.getId())) {
            throw ApiException.notFound("Prospect not found");
        }
        return prospect;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
