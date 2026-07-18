package com.iman.investment.repository;

import com.iman.investment.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.UUID;

import java.time.Instant;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID>, JpaSpecificationExecutor<AuditLog> {
    long countByCreatedAtGreaterThanEqual(Instant since);
    long countByCreatedAtBetween(Instant start, Instant end);
}
