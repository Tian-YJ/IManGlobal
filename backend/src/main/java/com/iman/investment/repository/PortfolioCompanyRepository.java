package com.iman.investment.repository;

import com.iman.investment.entity.PortfolioCompany;
import com.iman.investment.enums.ContentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PortfolioCompanyRepository extends JpaRepository<PortfolioCompany, UUID>, JpaSpecificationExecutor<PortfolioCompany> {
    List<PortfolioCompany> findByFeaturedTrueAndStatusOrderByDisplayOrderAsc(ContentStatus status);
    List<PortfolioCompany> findByStatusOrderByDisplayOrderAsc(ContentStatus status);
}
