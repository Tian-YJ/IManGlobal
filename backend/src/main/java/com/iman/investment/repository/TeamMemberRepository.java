package com.iman.investment.repository;

import com.iman.investment.entity.TeamMember;
import com.iman.investment.enums.ContentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TeamMemberRepository extends JpaRepository<TeamMember, UUID>, JpaSpecificationExecutor<TeamMember> {
    List<TeamMember> findByStatusOrderByDisplayOrderAsc(ContentStatus status);
}
