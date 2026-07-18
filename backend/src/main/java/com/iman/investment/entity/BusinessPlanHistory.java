package com.iman.investment.entity;

import com.iman.investment.enums.BusinessPlanStatus;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "business_plan_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusinessPlanHistory extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "business_plan_id", nullable = false)
    private BusinessPlan businessPlan;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", length = 20)
    private BusinessPlanStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false, length = 20)
    private BusinessPlanStatus toStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by_id")
    private User changedBy;

    @Column(columnDefinition = "TEXT")
    private String comment;
}
