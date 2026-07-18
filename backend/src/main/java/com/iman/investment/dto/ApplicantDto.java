package com.iman.investment.dto;

import com.iman.investment.enums.ApplicantStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

public class ApplicantDto {

    @Data
    public static class Request {
        @NotBlank private String firstName;
        @NotBlank private String lastName;
        @NotBlank @Email private String email;
        @NotBlank private String phone;
        @NotBlank private String linkedinUrl;
        @NotBlank private String coverLetter;
    }

    @Data
    public static class Response {
        private UUID id;
        private UUID jobId;
        private String jobTitle;
        private String firstName;
        private String lastName;
        private String email;
        private String phone;
        private String linkedinUrl;
        private String coverLetter;
        private String resumeName;
        private ApplicantStatus status;
        private Instant createdAt;
        private Instant updatedAt;
    }

    @Data
    public static class StatusUpdate {
        private ApplicantStatus status;
        private String comment;
    }
}
