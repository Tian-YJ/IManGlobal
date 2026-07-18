package com.iman.investment.repository;

import com.iman.investment.entity.Job;
import com.iman.investment.enums.JobStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface JobRepository extends JpaRepository<Job, UUID>, JpaSpecificationExecutor<Job> {
    Optional<Job> findBySlug(String slug);
    List<Job> findByStatusOrderByDatePostedDesc(JobStatus status);
}
