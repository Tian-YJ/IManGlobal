package com.iman.investment.repository;

import com.iman.investment.entity.CmsPage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CmsPageRepository extends JpaRepository<CmsPage, UUID>, JpaSpecificationExecutor<CmsPage> {
    Optional<CmsPage> findBySlug(String slug);
}
