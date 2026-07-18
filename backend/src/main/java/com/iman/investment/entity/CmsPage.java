package com.iman.investment.entity;

import com.iman.investment.enums.ContentStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "cms_pages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CmsPage extends BaseEntity {

    @Column(nullable = false, length = 200)
    private String title;

    @Column(unique = true, nullable = false, length = 200)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "meta_title", length = 200)
    private String metaTitle;

    @Column(name = "meta_description", length = 500)
    private String metaDescription;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ContentStatus status = ContentStatus.DRAFT;

    @Column(name = "published_at")
    private LocalDate publishedAt;
}
