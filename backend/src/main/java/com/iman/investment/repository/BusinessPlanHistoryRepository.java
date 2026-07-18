package com.iman.investment.repository;

import com.iman.investment.entity.BusinessPlanHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface BusinessPlanHistoryRepository extends JpaRepository<BusinessPlanHistory, UUID>, JpaSpecificationExecutor<BusinessPlanHistory> {
}
