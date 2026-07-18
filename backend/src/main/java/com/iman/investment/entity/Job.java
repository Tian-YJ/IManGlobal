package com.iman.investment.entity;

import com.iman.investment.enums.JobStatus;
import com.iman.investment.enums.JobType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "jobs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Job extends BaseEntity {

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 100)
    private String department;

    @Column(length = 100)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private JobType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private JobStatus status = JobStatus.DRAFT;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String responsibilities;

    @Column(columnDefinition = "TEXT")
    private String requirements;

    @Column(columnDefinition = "TEXT")
    private String benefits;

    @Column(length = 100)
    private String experience;

    @Column(length = 100)
    private String education;

    @Column(name = "salary_min", precision = 19, scale = 2)
    private java.math.BigDecimal salaryMin;

    @Column(name = "salary_max", precision = 19, scale = 2)
    private java.math.BigDecimal salaryMax;

    @Column(name = "meta_title", length = 200)
    private String metaTitle;

    @Column(name = "meta_description", length = 500)
    private String metaDescription;

    @Column(unique = true, length = 200)
    private String slug;

    @Column(name = "date_posted")
    private LocalDate datePosted;

    @OneToMany(mappedBy = "job", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Applicant> applicants = new ArrayList<>();
}
