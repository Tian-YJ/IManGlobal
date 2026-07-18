package com.iman.investment.entity;

import com.iman.investment.enums.BusinessPlanStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "business_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusinessPlan extends BaseEntity {

    @Column(name = "founder_name", nullable = false, length = 200)
    private String founderName;

    @Column(name = "founder_position", length = 100)
    private String founderPosition;

    @Column(name = "founder_email", nullable = false, length = 200)
    private String founderEmail;

    @Column(name = "founder_phone", length = 50)
    private String founderPhone;

    @Column(length = 100)
    private String country;

    @Column(name = "linkedin_url", length = 500)
    private String linkedinUrl;

    @Column(length = 500)
    private String website;

    @Column(name = "company_name", nullable = false, length = 200)
    private String companyName;

    @Column(length = 100)
    private String industry;

    @Column(length = 50)
    private String stage;

    @Column(name = "team_size")
    private Integer teamSize;

    @Column(name = "founded_date")
    private LocalDate foundedDate;

    @Column(name = "funding_amount", precision = 19, scale = 2)
    private BigDecimal fundingAmount;

    @Column(precision = 19, scale = 2)
    private BigDecimal revenue;

    @Column(name = "monthly_growth", precision = 10, scale = 2)
    private BigDecimal monthlyGrowth;

    @Column(name = "company_description", columnDefinition = "TEXT")
    private String companyDescription;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private BusinessPlanStatus status = BusinessPlanStatus.DRAFT;

    @Column(name = "current_step")
    @Builder.Default
    private Integer currentStep = 1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;

    @OneToMany(mappedBy = "businessPlan", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BusinessPlanDocument> documents = new ArrayList<>();

    @OneToMany(mappedBy = "businessPlan", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BusinessPlanNote> notes = new ArrayList<>();

    @OneToMany(mappedBy = "businessPlan", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BusinessPlanHistory> history = new ArrayList<>();
}
