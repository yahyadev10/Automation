package com.leadflowai.leadflow.prospect;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProspectRepository extends JpaRepository<Prospect, UUID> {

    @Query("""
            select p from Prospect p
            where p.deletedAt is null
              and p.owner.id = :ownerId
              and (:status is null or p.status = :status)
              and (:search is null or lower(p.companyName) like lower(concat('%', :search, '%'))
                    or lower(coalesce(p.contactName, '')) like lower(concat('%', :search, '%'))
                    or lower(coalesce(p.industry, '')) like lower(concat('%', :search, '%')))
            """)
    Page<Prospect> search(@Param("ownerId") UUID ownerId,
                          @Param("status") ProspectStatus status,
                          @Param("search") String search,
                          Pageable pageable);

    @Query("select p from Prospect p where p.id = :id and p.deletedAt is null")
    Optional<Prospect> findActiveById(@Param("id") UUID id);

    @Query("select count(p) from Prospect p where p.deletedAt is null")
    long countActive();

    @Query("select count(p) from Prospect p where p.deletedAt is null and p.status = :status")
    long countByStatus(@Param("status") ProspectStatus status);

    @Query("select p from Prospect p where p.deletedAt is null and p.source = com.leadflowai.leadflow.prospect.ProspectSource.DEMO")
    List<Prospect> findAllDemo();
}
