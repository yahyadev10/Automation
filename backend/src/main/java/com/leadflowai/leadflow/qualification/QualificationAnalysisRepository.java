package com.leadflowai.leadflow.qualification;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface QualificationAnalysisRepository extends JpaRepository<QualificationAnalysis, UUID> {

    Page<QualificationAnalysis> findByProspectIdOrderByCreatedAtDesc(UUID prospectId, Pageable pageable);

    List<QualificationAnalysis> findTop10ByProspectIdOrderByCreatedAtDesc(UUID prospectId);

    Optional<QualificationAnalysis> findFirstByProspectIdOrderByCreatedAtDesc(UUID prospectId);

    long count();

    @SuppressWarnings("unused")
    long countByCategory(QualificationCategory category);
}
