package com.leadflowai.leadflow.activity;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface ActivityEventRepository extends JpaRepository<ActivityEvent, UUID> {

    Page<ActivityEvent> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<ActivityEvent> findTop10ByOrderByCreatedAtDesc();

    List<ActivityEvent> findTop20ByProspectIdOrderByCreatedAtDesc(UUID prospectId);
}
