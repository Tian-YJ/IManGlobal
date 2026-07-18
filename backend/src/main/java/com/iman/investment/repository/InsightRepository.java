package com.iman.investment.repository;

import com.iman.investment.entity.Insight;
import com.iman.investment.enums.ContentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InsightRepository extends JpaRepository<Insight, UUID>, JpaSpecificationExecutor<Insight> {
    Optional<Insight> findBySlug(String slug);
    List<Insight> findByStatusOrderByPublishedDateDesc(ContentStatus status);
}
