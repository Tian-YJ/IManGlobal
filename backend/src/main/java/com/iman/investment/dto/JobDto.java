package com.iman.investment.dto;

import com.iman.investment.enums.JobStatus;
import com.iman.investment.enums.JobType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public class JobDto {

    @Data
    public static class Request {
        @NotBlank private String title;
        private String department;
        private String location;
        @NotNull private JobType type;
        private JobStatus status;
        private String description;
        private String responsibilities;
        private String requirements;
        private String benefits;
        private String experience;
        private String education;
        private BigDecimal salaryMin;
        private BigDecimal salaryMax;
        private String metaTitle;
        private String metaDescription;
        private String slug;
        private LocalDate datePosted;
    }

    @Data
    public static class Response {
        private UUID id;
        private String title;
        private String department;
        private String location;
        private JobType type;
        private JobStatus status;
        private String description;
        private String responsibilities;
        private String requirements;
        private String benefits;
        private String experience;
        private String education;
        private BigDecimal salaryMin;
        private BigDecimal salaryMax;
        private String metaTitle;
        private String metaDescription;
        private String slug;
        private LocalDate datePosted;
        private Instant createdAt;
        private Instant updatedAt;
    }
}
