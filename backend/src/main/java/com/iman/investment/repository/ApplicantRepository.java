package com.iman.investment.repository;

import com.iman.investment.entity.Applicant;
import com.iman.investment.enums.ApplicantStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.UUID;

@Repository
public interface ApplicantRepository extends JpaRepository<Applicant, UUID>, JpaSpecificationExecutor<Applicant> {
    long countByStatus(ApplicantStatus status);
    long countByCreatedAtGreaterThanEqual(Instant since);
}
