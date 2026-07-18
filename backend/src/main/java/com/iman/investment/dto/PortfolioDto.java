package com.iman.investment.dto;

import com.iman.investment.enums.ContentStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public class PortfolioDto {

    @Data
    public static class Request {
        @NotBlank private String name;
        private String industry;
        private String description;
        private String imageUrl;
        private String website;
        private Boolean featured;
        private Integer displayOrder;
        private ContentStatus status;
    }

    @Data
    public static class Response {
        private UUID id;
        private String name;
        private String industry;
        private String description;
        private String imageUrl;
        private String website;
        private Boolean featured;
        private Integer displayOrder;
        private ContentStatus status;
        private Instant createdAt;
    }
}
