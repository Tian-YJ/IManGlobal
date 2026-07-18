package com.iman.investment.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

public class ContactDto {

    @Data
    public static class Request {
        @NotBlank private String name;
        @NotBlank @Email private String email;
        @NotBlank private String phone;
        @NotBlank private String subject;
        @NotBlank private String message;
    }

    @Data
    public static class Response {
        private UUID id;
        private String name;
        private String email;
        private String phone;
        private String subject;
        private String message;
        private Boolean read;
        private Instant createdAt;
    }
}
