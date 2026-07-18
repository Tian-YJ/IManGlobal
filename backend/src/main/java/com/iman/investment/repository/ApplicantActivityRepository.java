package com.iman.investment.repository;

import com.iman.investment.entity.ApplicantActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ApplicantActivityRepository extends JpaRepository<ApplicantActivity, UUID>, JpaSpecificationExecutor<ApplicantActivity> {
}
