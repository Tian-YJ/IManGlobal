package com.iman.investment.entity;

import com.iman.investment.enums.ContentStatus;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "portfolio_companies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortfolioCompany extends BaseEntity {

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 100)
    private String industry;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(length = 500)
    private String website;

    @Column(name = "is_featured")
    @Builder.Default
    private Boolean featured = false;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ContentStatus status = ContentStatus.PUBLISHED;
}
