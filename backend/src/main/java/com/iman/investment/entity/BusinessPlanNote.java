package com.iman.investment.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "business_plan_notes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusinessPlanNote extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "business_plan_id", nullable = false)
    private BusinessPlan businessPlan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;
}
