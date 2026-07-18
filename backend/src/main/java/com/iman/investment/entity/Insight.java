package com.iman.investment.entity;

import com.iman.investment.enums.ContentStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "insights")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Insight extends BaseEntity {

    @Column(nullable = false, length = 300)
    private String title;

    @Column(unique = true, nullable = false, length = 200)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String excerpt;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(length = 100)
    private String author;

    @Column(name = "published_date")
    private LocalDate publishedDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ContentStatus status = ContentStatus.DRAFT;
}
