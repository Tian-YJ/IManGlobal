package com.iman.investment.repository;

import com.iman.investment.entity.BusinessPlanNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface BusinessPlanNoteRepository extends JpaRepository<BusinessPlanNote, UUID>, JpaSpecificationExecutor<BusinessPlanNote> {
}
