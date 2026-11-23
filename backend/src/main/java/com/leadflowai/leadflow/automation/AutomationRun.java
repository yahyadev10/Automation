package com.leadflowai.leadflow.automation;

import com.leadflowai.leadflow.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "automation_runs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AutomationRun extends BaseEntity {

    public enum RunStatus { PENDING, COMPLETED, FAILED }
    public enum RunType { QUALIFICATION, EMAIL_DRAFT, EMAIL_SEND }

    @Id
    private UUID id;

    @Column(name = "correlation_id", nullable = false, unique = true)
    private UUID correlationId;

    @Enumerated(EnumType.STRING)
    @Column(name = "automation_type", nullable = false)
    private RunType automationType;

    @Column(name = "prospect_id")
    private UUID prospectId;

    @Column(name = "draft_id")
    private UUID draftId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RunStatus status;

    @Column(name = "error_message", columnDefinition = "text")
    private String errorMessage;
}
