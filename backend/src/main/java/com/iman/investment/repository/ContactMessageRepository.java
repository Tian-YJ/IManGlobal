package com.iman.investment.repository;

import com.iman.investment.entity.ContactMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.UUID;

@Repository
public interface ContactMessageRepository extends JpaRepository<ContactMessage, UUID>, JpaSpecificationExecutor<ContactMessage> {
    long countByCreatedAtGreaterThanEqual(Instant since);
}
