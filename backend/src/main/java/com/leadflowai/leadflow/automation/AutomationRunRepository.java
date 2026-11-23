package com.leadflowai.leadflow.automation;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AutomationRunRepository extends JpaRepository<AutomationRun, UUID> {

    Optional<AutomationRun> findByCorrelationId(UUID correlationId);

    boolean existsByCorrelationIdAndStatus(UUID correlationId, AutomationRun.RunStatus status);

    boolean existsByDraftIdAndAutomationTypeAndStatus(UUID draftId,
                                                       AutomationRun.RunType automationType,
                                                       AutomationRun.RunStatus status);
}
