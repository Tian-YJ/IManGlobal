package com.iman.investment.dto;

import com.iman.investment.enums.ApplicantStatus;
import com.iman.investment.enums.BusinessPlanStatus;
import com.iman.investment.enums.ContentStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

public final class AdminRequests {
    private AdminRequests() {}

    public record Note(@NotBlank @Size(max = 10000) String content) {}
    public record Assignment(@NotNull UUID userId) {}
    public record BusinessPlanStatusChange(@NotNull BusinessPlanStatus status, @Size(max = 5000) String comment) {}
    public record ApplicantStatusChange(@NotNull ApplicantStatus status, @Size(max = 5000) String comment) {}
    public record CmsPage(@NotBlank @Size(max = 200) String title, @NotBlank @Size(max = 200) String slug,
                          @Size(max = 1000000) String content, @Size(max = 200) String metaTitle,
                          @Size(max = 500) String metaDescription, ContentStatus status, LocalDate publishedAt) {}
    public record User(@NotBlank @Email String email, @NotBlank @Size(max = 100) String firstName,
                       @NotBlank @Size(max = 100) String lastName, @Size(max = 50) String phone,
                       @Size(min = 12, max = 128) String password, Boolean active, Set<UUID> roleIds) {}
    public record Role(@NotBlank @Size(max = 50) String name, @Size(max = 255) String description,
                       Set<UUID> permissionIds) {}
    public record Permission(@NotBlank @Size(max = 100) String code, @NotBlank @Size(max = 100) String name,
                             @Size(max = 255) String description, @Size(max = 50) String module) {}
    public record Setting(@NotBlank @Size(max = 100) String key, @Size(max = 100000) String value,
                          @Size(max = 255) String description, @Size(max = 50) String category) {}
    public record Notification(@NotNull UUID userId, @NotBlank @Size(max = 200) String title,
                               @Size(max = 10000) String message, @Size(max = 50) String type,
                               @Size(max = 500) String linkUrl) {}
    public record JobPublishingConfig(Boolean enabled, Integer publishPerDay, Integer maxOpen,
                                      Boolean autoRotate, @Size(max = 80) String publishZone,
                                      Integer publishHour) {}
}
