package com.iman.investment.repository;

import com.iman.investment.entity.ApplicantNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ApplicantNoteRepository extends JpaRepository<ApplicantNote, UUID>, JpaSpecificationExecutor<ApplicantNote> {
}
