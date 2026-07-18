package com.iman.investment.entity;

import com.iman.investment.enums.ApplicantStatus;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "applicants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Applicant extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(nullable = false, length = 200)
    private String email;

    @Column(length = 50)
    private String phone;

    @Column(name = "linkedin_url", length = 500)
    private String linkedinUrl;

    @Column(name = "cover_letter", columnDefinition = "TEXT")
    private String coverLetter;

    @Column(name = "cover_letter_path", length = 500)
    private String coverLetterPath;

    @Column(name = "cover_letter_name", length = 255)
    private String coverLetterName;

    @Column(name = "resume_path", length = 500)
    private String resumePath;

    @Column(name = "resume_name", length = 255)
    private String resumeName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ApplicantStatus status = ApplicantStatus.NEW;

    @OneToMany(mappedBy = "applicant", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ApplicantNote> notes = new ArrayList<>();

    @OneToMany(mappedBy = "applicant", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ApplicantActivity> activities = new ArrayList<>();
}
