package com.leadflowai.leadflow.emaildraft;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EmailDraftRepository extends JpaRepository<EmailDraft, UUID> {

    Page<EmailDraft> findByStatusOrderByCreatedAtDesc(DraftStatus status, Pageable pageable);

    List<EmailDraft> findTop20ByProspectIdOrderByCreatedAtDesc(UUID prospectId);

    Optional<EmailDraft> findFirstByProspectIdOrderByCreatedAtDesc(UUID prospectId);

    long countByStatus(DraftStatus status);

    @Query("select d from EmailDraft d where d.status = :status and d.prospect.id = :prospectId")
    List<EmailDraft> findByProspectAndStatus(@Param("status") DraftStatus status,
                                              @Param("prospectId") UUID prospectId);
}
