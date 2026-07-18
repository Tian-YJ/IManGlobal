package com.iman.investment.repository;

import com.iman.investment.entity.BusinessPlan;
import com.iman.investment.enums.BusinessPlanStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.UUID;

@Repository
public interface BusinessPlanRepository extends JpaRepository<BusinessPlan, UUID>, JpaSpecificationExecutor<BusinessPlan> {
    long countByStatus(BusinessPlanStatus status);
    long countByCreatedAtGreaterThanEqual(Instant since);
}
