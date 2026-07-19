package com.iman.investment.repository;

import com.iman.investment.entity.BusinessPlanDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BusinessPlanDocumentRepository extends JpaRepository<BusinessPlanDocument, UUID>, JpaSpecificationExecutor<BusinessPlanDocument> {
    List<BusinessPlanDocument> findByBusinessPlan_Id(UUID businessPlanId);
    long countByBusinessPlan_Id(UUID businessPlanId);
}
