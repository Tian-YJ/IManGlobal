package com.iman.investment.mapper;

import com.iman.investment.entity.*;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class ApiMapper {

    public Map<String, Object> portfolio(PortfolioCompany value) {
        return map(value, "name", value.getName(), "industry", value.getIndustry(), "description", value.getDescription(),
                "imageUrl", value.getImageUrl(), "website", value.getWebsite(), "featured", value.getFeatured(),
                "displayOrder", value.getDisplayOrder(), "status", value.getStatus());
    }

    public Map<String, Object> insight(Insight value) {
        return map(value, "title", value.getTitle(), "slug", value.getSlug(), "excerpt", value.getExcerpt(),
                "content", value.getContent(), "imageUrl", value.getImageUrl(), "author", value.getAuthor(),
                "publishedDate", value.getPublishedDate(), "status", value.getStatus());
    }

    public Map<String, Object> team(TeamMember value) {
        return map(value, "fullName", value.getFullName(), "role", value.getRole(), "bio", value.getBio(),
                "imageUrl", value.getImageUrl(), "linkedinUrl", value.getLinkedinUrl(),
                "displayOrder", value.getDisplayOrder(), "status", value.getStatus());
    }

    public Map<String, Object> job(Job value) {
        return map(value, "title", value.getTitle(), "department", value.getDepartment(), "location", value.getLocation(),
                "type", value.getType(), "status", value.getStatus(), "description", value.getDescription(),
                "responsibilities", value.getResponsibilities(), "requirements", value.getRequirements(),
                "benefits", value.getBenefits(), "experience", value.getExperience(), "education", value.getEducation(),
                "salaryMin", value.getSalaryMin(), "salaryMax", value.getSalaryMax(), "metaTitle", value.getMetaTitle(),
                "metaDescription", value.getMetaDescription(), "slug", value.getSlug(), "datePosted", value.getDatePosted());
    }

    public Map<String, Object> applicant(Applicant value) {
        return map(value, "jobId", value.getJob().getId(), "jobTitle", value.getJob().getTitle(),
                "firstName", value.getFirstName(), "lastName", value.getLastName(), "email", value.getEmail(),
                "phone", value.getPhone(), "linkedinUrl", value.getLinkedinUrl(), "coverLetter", value.getCoverLetter(),
                "resumeName", value.getResumeName(), "coverLetterName", value.getCoverLetterName(), "status", value.getStatus());
    }

    public Map<String, Object> businessPlan(BusinessPlan value) {
        Map<String, Object> result = map(value, "founderName", value.getFounderName(), "founderPosition", value.getFounderPosition(),
                "founderEmail", value.getFounderEmail(), "founderPhone", value.getFounderPhone(), "country", value.getCountry(),
                "linkedinUrl", value.getLinkedinUrl(), "website", value.getWebsite(), "companyName", value.getCompanyName(),
                "industry", value.getIndustry(), "stage", value.getStage(), "teamSize", value.getTeamSize(),
                "foundedDate", value.getFoundedDate(), "fundingAmount", value.getFundingAmount(), "revenue", value.getRevenue(),
                "monthlyGrowth", value.getMonthlyGrowth(), "companyDescription", value.getCompanyDescription(),
                "status", value.getStatus(), "currentStep", value.getCurrentStep());
        result.put("assignedTo", value.getAssignedTo() == null ? null : userSummary(value.getAssignedTo()));
        result.put("documents", value.getDocuments().stream().map(this::document).toList());
        return result;
    }

    public Map<String, Object> cms(CmsPage value) {
        return map(value, "title", value.getTitle(), "slug", value.getSlug(), "content", value.getContent(),
                "metaTitle", value.getMetaTitle(), "metaDescription", value.getMetaDescription(),
                "status", value.getStatus(), "publishedAt", value.getPublishedAt());
    }

    public Map<String, Object> user(User value) {
        Map<String, Object> result = map(value, "email", value.getEmail(), "firstName", value.getFirstName(),
                "lastName", value.getLastName(), "phone", value.getPhone(), "avatarUrl", value.getAvatarUrl(),
                "active", value.getActive());
        result.put("roles", value.getRoles().stream().map(Role::getName).sorted().toList());
        return result;
    }

    public Map<String, Object> role(Role value) {
        Map<String, Object> result = map(value, "name", value.getName(), "description", value.getDescription());
        result.put("permissions", value.getPermissions().stream().map(Permission::getCode).sorted().toList());
        return result;
    }

    public Map<String, Object> permission(Permission value) {
        return map(value, "code", value.getCode(), "name", value.getName(),
                "description", value.getDescription(), "module", value.getModule());
    }

    public Map<String, Object> contact(ContactMessage value) {
        return map(value, "name", value.getName(), "email", value.getEmail(), "phone", value.getPhone(),
                "subject", value.getSubject(), "message", value.getMessage(), "read", value.getRead());
    }

    public Map<String, Object> setting(Setting value) {
        return map(value, "key", value.getKey(), "value", value.getValue(),
                "description", value.getDescription(), "category", value.getCategory());
    }

    public Map<String, Object> notification(Notification value) {
        return map(value, "title", value.getTitle(), "message", value.getMessage(), "type", value.getType(),
                "read", value.getRead(), "linkUrl", value.getLinkUrl());
    }

    public Map<String, Object> media(MediaFile value) {
        return map(value, "fileName", value.getFileName(), "originalName", value.getOriginalName(),
                "filePath", value.getFilePath(), "mediaType", value.getMediaType(), "mimeType", value.getMimeType(),
                "fileSize", value.getFileSize(), "alt", value.getAlt());
    }

    public Map<String, Object> audit(AuditLog value) {
        return map(value, "user", value.getUser() == null ? null : userSummary(value.getUser()), "action", value.getAction(),
                "module", value.getModule(), "entityType", value.getEntityType(), "entityId", value.getEntityId(),
                "details", value.getDetails(), "ipAddress", value.getIpAddress());
    }

    public Map<String, Object> history(BusinessPlanHistory value) {
        return map(value, "fromStatus", value.getFromStatus(), "toStatus", value.getToStatus(),
                "changedBy", value.getChangedBy() == null ? null : userSummary(value.getChangedBy()), "comment", value.getComment());
    }

    public Map<String, Object> note(ApplicantNote value) {
        return map(value, "author", userSummary(value.getAuthor()), "content", value.getContent());
    }

    public Map<String, Object> activity(ApplicantActivity value) {
        return map(value, "fromStatus", value.getFromStatus(), "toStatus", value.getToStatus(),
                "changedBy", value.getChangedBy() == null ? null : userSummary(value.getChangedBy()), "comment", value.getComment());
    }

    private Map<String, Object> document(BusinessPlanDocument value) {
        return map(value, "originalName", value.getOriginalName(), "fileType", value.getFileType(),
                "fileSize", value.getFileSize(), "mimeType", value.getMimeType());
    }

    private Map<String, Object> userSummary(User value) {
        return Map.of("id", value.getId(), "email", value.getEmail(),
                "name", value.getFirstName() + " " + value.getLastName());
    }

    private Map<String, Object> map(BaseEntity entity, Object... values) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", entity.getId());
        for (int i = 0; i < values.length; i += 2) {
            result.put((String) values[i], values[i + 1]);
        }
        result.put("createdAt", entity.getCreatedAt());
        result.put("updatedAt", entity.getUpdatedAt());
        return result;
    }
}
