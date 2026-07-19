package com.iman.investment.dto;

import com.iman.investment.enums.BusinessPlanStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public class BusinessPlanDto {

    @Data
    public static class Request {
        @NotBlank private String founderName;
        @NotBlank private String founderPosition;
        @NotBlank @Email private String founderEmail;
        @NotBlank private String founderPhone;
        @NotBlank private String country;
        private String linkedinUrl;
        @NotBlank private String website;
        @NotBlank private String companyName;
        @NotBlank private String industry;
        @NotBlank private String stage;
        @NotNull @Positive private Integer teamSize;
        @NotNull private LocalDate foundedDate;
        @NotNull @PositiveOrZero private BigDecimal fundingAmount;
        @NotNull @PositiveOrZero private BigDecimal revenue;
        @NotNull private BigDecimal monthlyGrowth;
        @NotBlank private String companyDescription;
        private BusinessPlanStatus status;
        private Integer currentStep;
    }

    @Data
    public static class Response {
        private UUID id;
        private String founderName;
        private String founderPosition;
        private String founderEmail;
        private String founderPhone;
        private String country;
        private String linkedinUrl;
        private String website;
        private String companyName;
        private String industry;
        private String stage;
        private Integer teamSize;
        private LocalDate foundedDate;
        private BigDecimal fundingAmount;
        private BigDecimal revenue;
        private BigDecimal monthlyGrowth;
        private String companyDescription;
        private BusinessPlanStatus status;
        private Integer currentStep;
        private String assignedToName;
        private Instant createdAt;
        private Instant updatedAt;
    }

    @Data
    public static class StatusUpdate {
        private BusinessPlanStatus status;
        private String comment;
    }
}
