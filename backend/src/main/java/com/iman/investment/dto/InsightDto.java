package com.iman.investment.dto;

import com.iman.investment.enums.ContentStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public class InsightDto {

    @Data
    public static class Request {
        @NotBlank private String title;
        private String slug;
        private String excerpt;
        private String content;
        private String imageUrl;
        private String author;
        private LocalDate publishedDate;
        private ContentStatus status;
    }

    @Data
    public static class Response {
        private UUID id;
        private String title;
        private String slug;
        private String excerpt;
        private String content;
        private String imageUrl;
        private String author;
        private LocalDate publishedDate;
        private ContentStatus status;
        private Instant createdAt;
    }
}
