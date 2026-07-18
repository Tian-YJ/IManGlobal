package com.iman.investment.dto;

import com.iman.investment.enums.ContentStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

public class TeamMemberDto {

    @Data
    public static class Request {
        @NotBlank private String fullName;
        @NotBlank private String role;
        private String bio;
        private String imageUrl;
        private String linkedinUrl;
        private Integer displayOrder;
        private ContentStatus status;
    }

    @Data
    public static class Response {
        private UUID id;
        private String fullName;
        private String role;
        private String bio;
        private String imageUrl;
        private String linkedinUrl;
        private Integer displayOrder;
        private ContentStatus status;
        private Instant createdAt;
    }
}
