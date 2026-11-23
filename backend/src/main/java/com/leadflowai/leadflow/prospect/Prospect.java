package com.leadflowai.leadflow.prospect;

import com.leadflowai.leadflow.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.leadflowai.leadflow.user.User;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "prospects")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Prospect extends BaseEntity {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(name = "company_name", nullable = false)
    private String companyName;

    @Column(name = "contact_name")
    private String contactName;

    private String email;

    private String website;

    private String industry;

    @Column(name = "company_description", nullable = false, columnDefinition = "text")
    private String companyDescription;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProspectSource source;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProspectStatus status;

    @Column(name = "deleted_at")
    private Instant deletedAt;
}
