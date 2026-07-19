package com.iman.investment.service;

import com.iman.investment.dto.*;
import com.iman.investment.entity.*;
import com.iman.investment.enums.*;
import com.iman.investment.exception.BadRequestException;
import com.iman.investment.exception.ResourceNotFoundException;
import com.iman.investment.mapper.ApiMapper;
import com.iman.investment.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.*;
import java.util.function.Function;

@Service
@RequiredArgsConstructor
public class AdminApiService {
    private final BusinessPlanRepository businessPlans;
    private final BusinessPlanHistoryRepository planHistory;
    private final BusinessPlanNoteRepository planNotes;
    private final BusinessPlanDocumentRepository planDocuments;
    private final PortfolioCompanyRepository portfolio;
    private final JobRepository jobs;
    private final ApplicantRepository applicants;
    private final ApplicantNoteRepository applicantNotes;
    private final ApplicantActivityRepository applicantActivities;
    private final CmsPageRepository cms;
    private final InsightRepository insights;
    private final TeamMemberRepository team;
    private final MediaFileRepository media;
    private final UserRepository users;
    private final RoleRepository roles;
    private final PermissionRepository permissions;
    private final AuditLogRepository auditLogs;
    private final SettingRepository settings;
    private final NotificationRepository notifications;
    private final ContactMessageRepository contacts;
    private final ApiMapper mapper;
    private final FileStorageService files;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService audit;

    @Transactional(readOnly = true)
    public Page<Map<String, Object>> plans(Pageable page, String search, BusinessPlanStatus status) {
        Specification<BusinessPlan> spec = containsAny(search, "companyName", "founderName", "founderEmail");
        if (status != null) spec = spec.and(equal("status", status));
        return businessPlans.findAll(spec, page).map(mapper::businessPlan);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> plan(UUID id) { return mapper.businessPlan(planEntity(id)); }

    @Transactional
    public Map<String, Object> planStatus(UUID id, AdminRequests.BusinessPlanStatusChange request, String email) {
        BusinessPlan plan = planEntity(id);
        BusinessPlanStatus from = plan.getStatus();
        if (!validPlanTransition(from, request.status())) throw new BadRequestException("Invalid business plan status transition");
        User actor = currentUser(email);
        plan.setStatus(request.status());
        businessPlans.save(plan);
        planHistory.save(BusinessPlanHistory.builder().businessPlan(plan).fromStatus(from).toStatus(request.status())
                .changedBy(actor).comment(request.comment()).build());
        audit.log(actor, AuditAction.UPDATE, "business_plans", "BusinessPlan", id.toString(), "Status " + from + " -> " + request.status());
        return mapper.businessPlan(plan);
    }

    @Transactional
    public Map<String, Object> assignPlan(UUID id, UUID userId, String email) {
        BusinessPlan plan = planEntity(id);
        User assignee = userEntity(userId);
        plan.setAssignedTo(assignee);
        businessPlans.save(plan);
        audit.log(currentUser(email), AuditAction.UPDATE, "business_plans", "BusinessPlan", id.toString(), "Assigned to " + assignee.getEmail());
        return mapper.businessPlan(plan);
    }

    @Transactional
    public Map<String, Object> addPlanNote(UUID id, String content, String email) {
        BusinessPlanNote note = planNotes.save(BusinessPlanNote.builder().businessPlan(planEntity(id))
                .author(currentUser(email)).content(content).build());
        return baseNote(note, note.getAuthor(), note.getContent());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> planNotes(UUID id) {
        planEntity(id);
        return planNotes.findAll((root, query, cb) -> cb.equal(root.get("businessPlan").get("id"), id),
                org.springframework.data.domain.Sort.by("createdAt").descending()).stream()
                .map(note -> baseNote(note, note.getAuthor(), note.getContent())).toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> planHistory(UUID id) {
        planEntity(id);
        return planHistory.findAll((root, query, cb) -> cb.equal(root.get("businessPlan").get("id"), id),
                org.springframework.data.domain.Sort.by("createdAt").descending()).stream().map(mapper::history).toList();
    }

    @Transactional(readOnly = true)
    public BusinessPlanDocument planDocument(UUID planId, UUID documentId) {
        BusinessPlanDocument document = planDocuments.findById(documentId).orElseThrow(() -> notFound("Document"));
        if (!document.getBusinessPlan().getId().equals(planId)) throw notFound("Document");
        return document;
    }

    @Transactional
    public void deletePlan(UUID id, String email) {
        BusinessPlan plan = planEntity(id);
        businessPlans.delete(plan);
        audit.log(currentUser(email), AuditAction.DELETE, "business_plans", "BusinessPlan", id.toString(), "Business plan deleted");
    }

    @Transactional(readOnly = true)
    public Page<Map<String, Object>> portfolios(Pageable page, String search, ContentStatus status) {
        Specification<PortfolioCompany> spec = containsAny(search, "name", "industry");
        if (status != null) spec = spec.and(equal("status", status));
        return portfolio.findAll(spec, page).map(mapper::portfolio);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> portfolio(UUID id) {
        return mapper.portfolio(portfolio.findById(id).orElseThrow(() -> notFound("Portfolio company")));
    }

    @Transactional
    public Map<String, Object> savePortfolio(UUID id, PortfolioDto.Request r, String email) {
        PortfolioCompany e = id == null ? new PortfolioCompany() : portfolio.findById(id).orElseThrow(() -> notFound("Portfolio company"));
        e.setName(r.getName()); e.setIndustry(r.getIndustry()); e.setDescription(r.getDescription()); e.setImageUrl(r.getImageUrl());
        e.setWebsite(r.getWebsite()); if (r.getFeatured() != null) e.setFeatured(r.getFeatured());
        if (r.getDisplayOrder() != null) e.setDisplayOrder(r.getDisplayOrder());
        if (r.getStatus() != null) e.setStatus(r.getStatus());
        portfolio.save(e); logSave(email, "portfolio", "PortfolioCompany", e.getId(), id == null);
        return mapper.portfolio(e);
    }

    @Transactional
    public void deletePortfolio(UUID id, String email) {
        PortfolioCompany e = portfolio.findById(id).orElseThrow(() -> notFound("Portfolio company"));
        portfolio.delete(e); audit.log(currentUser(email), AuditAction.DELETE, "portfolio", "PortfolioCompany", id.toString(), "Deleted");
    }

    @Transactional(readOnly = true)
    public Page<Map<String, Object>> jobList(Pageable page, String search, JobStatus status) {
        Specification<Job> spec = containsAny(search, "title", "department", "location");
        if (status != null) spec = spec.and(equal("status", status));
        return jobs.findAll(spec, page).map(mapper::job);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> job(UUID id) {
        return mapper.job(jobs.findById(id).orElseThrow(() -> notFound("Job")));
    }

    @Transactional
    public Map<String, Object> saveJob(UUID id, JobDto.Request r, String email) {
        Job e = id == null ? new Job() : jobs.findById(id).orElseThrow(() -> notFound("Job"));
        e.setTitle(r.getTitle()); e.setDepartment(r.getDepartment()); e.setLocation(r.getLocation()); e.setType(r.getType());
        e.setStatus(r.getStatus() == null ? (id == null ? JobStatus.DRAFT : e.getStatus()) : r.getStatus());
        e.setDescription(r.getDescription()); e.setResponsibilities(r.getResponsibilities()); e.setRequirements(r.getRequirements());
        e.setBenefits(r.getBenefits()); e.setExperience(r.getExperience()); e.setEducation(r.getEducation());
        e.setSalaryMin(r.getSalaryMin()); e.setSalaryMax(r.getSalaryMax()); e.setMetaTitle(r.getMetaTitle());
        e.setMetaDescription(r.getMetaDescription()); e.setSlug(uniqueSlug(r.getSlug(), r.getTitle(), id));
        if (r.getDatePosted() != null) e.setDatePosted(r.getDatePosted());
        if (e.getStatus() == JobStatus.PUBLISHED && e.getDatePosted() == null) e.setDatePosted(LocalDate.now());
        if (e.getStatus() == JobStatus.SCHEDULED && e.getDatePosted() == null) {
            throw new BadRequestException("Scheduled jobs require a publish date");
        }
        jobs.save(e); logSave(email, "jobs", "Job", e.getId(), id == null);
        return mapper.job(e);
    }

    @Transactional
    public void deleteJob(UUID id, String email) {
        Job e = jobs.findById(id).orElseThrow(() -> notFound("Job"));
        if (!e.getApplicants().isEmpty()) throw new BadRequestException("A job with applications cannot be deleted");
        jobs.delete(e); audit.log(currentUser(email), AuditAction.DELETE, "jobs", "Job", id.toString(), "Deleted");
    }

    @Transactional(readOnly = true)
    public Page<Map<String, Object>> applicantList(Pageable page, String search, ApplicantStatus status, UUID jobId) {
        Specification<Applicant> spec = containsAny(search, "firstName", "lastName", "email");
        if (status != null) spec = spec.and(equal("status", status));
        if (jobId != null) spec = spec.and((root, query, cb) -> cb.equal(root.get("job").get("id"), jobId));
        return applicants.findAll(spec, page).map(mapper::applicant);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> applicant(UUID id) {
        Applicant e = applicantEntity(id);
        Map<String, Object> result = new LinkedHashMap<>(mapper.applicant(e));
        result.put("notes", applicantNotes.findAll((root, query, cb) -> cb.equal(root.get("applicant").get("id"), id),
                org.springframework.data.domain.Sort.by("createdAt").descending()).stream().map(mapper::note).toList());
        result.put("activities", applicantActivities.findAll((root, query, cb) -> cb.equal(root.get("applicant").get("id"), id),
                org.springframework.data.domain.Sort.by("createdAt").descending()).stream().map(mapper::activity).toList());
        return result;
    }

    @Transactional(readOnly = true)
    public Applicant applicantFile(UUID id) { return applicantEntity(id); }

    @Transactional
    public Map<String, Object> applicantStatus(UUID id, AdminRequests.ApplicantStatusChange r, String email) {
        Applicant e = applicantEntity(id);
        ApplicantStatus from = e.getStatus();
        if (!validApplicantTransition(from, r.status())) throw new BadRequestException("Invalid applicant status transition");
        User actor = currentUser(email); e.setStatus(r.status()); applicants.save(e);
        applicantActivities.save(ApplicantActivity.builder().applicant(e).fromStatus(from).toStatus(r.status())
                .changedBy(actor).comment(r.comment()).build());
        audit.log(actor, AuditAction.UPDATE, "applicants", "Applicant", id.toString(), "Status " + from + " -> " + r.status());
        return mapper.applicant(e);
    }

    @Transactional
    public Map<String, Object> addApplicantNote(UUID id, String content, String email) {
        ApplicantNote note = applicantNotes.save(ApplicantNote.builder().applicant(applicantEntity(id))
                .author(currentUser(email)).content(content).build());
        return mapper.note(note);
    }

    @Transactional(readOnly = true)
    public Page<Map<String, Object>> cmsList(Pageable page, String search, ContentStatus status) {
        Specification<CmsPage> spec = containsAny(search, "title", "slug");
        if (status != null) spec = spec.and(equal("status", status));
        return cms.findAll(spec, page).map(mapper::cms);
    }

    @Transactional
    public Map<String, Object> saveCms(UUID id, AdminRequests.CmsPage r, String email) {
        CmsPage e = id == null ? new CmsPage() : cms.findById(id).orElseThrow(() -> notFound("CMS page"));
        cms.findBySlug(r.slug()).filter(found -> !found.getId().equals(id)).ifPresent(found -> { throw new BadRequestException("Slug already exists"); });
        e.setTitle(r.title()); e.setSlug(slug(r.slug())); e.setContent(r.content()); e.setMetaTitle(r.metaTitle());
        e.setMetaDescription(r.metaDescription()); e.setStatus(r.status() == null ? ContentStatus.DRAFT : r.status());
        e.setPublishedAt(e.getStatus() == ContentStatus.PUBLISHED ? (r.publishedAt() == null ? LocalDate.now() : r.publishedAt()) : r.publishedAt());
        cms.save(e); logSave(email, "cms", "CmsPage", e.getId(), id == null);
        return mapper.cms(e);
    }

    @Transactional
    public void deleteCms(UUID id, String email) {
        CmsPage e = cms.findById(id).orElseThrow(() -> notFound("CMS page")); cms.delete(e);
        audit.log(currentUser(email), AuditAction.DELETE, "cms", "CmsPage", id.toString(), "Deleted");
    }

    @Transactional(readOnly = true)
    public Page<Map<String, Object>> insightList(Pageable page, String search, ContentStatus status) {
        Specification<Insight> spec = containsAny(search, "title", "author", "slug");
        if (status != null) spec = spec.and(equal("status", status));
        return insights.findAll(spec, page).map(mapper::insight);
    }

    @Transactional
    public Map<String, Object> saveInsight(UUID id, InsightDto.Request r, String email) {
        Insight e = id == null ? new Insight() : insights.findById(id).orElseThrow(() -> notFound("Insight"));
        String itemSlug = slug(r.getSlug() == null ? r.getTitle() : r.getSlug());
        insights.findBySlug(itemSlug).filter(found -> !found.getId().equals(id)).ifPresent(found -> { throw new BadRequestException("Slug already exists"); });
        e.setTitle(r.getTitle()); e.setSlug(itemSlug); e.setExcerpt(r.getExcerpt()); e.setContent(r.getContent());
        e.setImageUrl(r.getImageUrl()); e.setAuthor(r.getAuthor()); e.setStatus(r.getStatus() == null ? ContentStatus.DRAFT : r.getStatus());
        e.setPublishedDate(e.getStatus() == ContentStatus.PUBLISHED && r.getPublishedDate() == null ? LocalDate.now() : r.getPublishedDate());
        insights.save(e); logSave(email, "cms", "Insight", e.getId(), id == null); return mapper.insight(e);
    }

    @Transactional
    public void deleteInsight(UUID id, String email) {
        Insight e = insights.findById(id).orElseThrow(() -> notFound("Insight")); insights.delete(e);
        audit.log(currentUser(email), AuditAction.DELETE, "cms", "Insight", id.toString(), "Deleted");
    }

    @Transactional(readOnly = true)
    public Page<Map<String, Object>> teamList(Pageable page, String search, ContentStatus status) {
        Specification<TeamMember> spec = containsAny(search, "fullName", "role");
        if (status != null) spec = spec.and(equal("status", status));
        return team.findAll(spec, page).map(mapper::team);
    }

    @Transactional
    public Map<String, Object> saveTeam(UUID id, TeamMemberDto.Request r, String email) {
        TeamMember e = id == null ? new TeamMember() : team.findById(id).orElseThrow(() -> notFound("Team member"));
        e.setFullName(r.getFullName()); e.setRole(r.getRole()); e.setBio(r.getBio()); e.setImageUrl(r.getImageUrl());
        e.setLinkedinUrl(r.getLinkedinUrl()); if (r.getDisplayOrder() != null) e.setDisplayOrder(r.getDisplayOrder());
        if (r.getStatus() != null) e.setStatus(r.getStatus()); team.save(e); logSave(email, "cms", "TeamMember", e.getId(), id == null);
        return mapper.team(e);
    }

    @Transactional
    public void deleteTeam(UUID id, String email) {
        TeamMember e = team.findById(id).orElseThrow(() -> notFound("Team member")); team.delete(e);
        audit.log(currentUser(email), AuditAction.DELETE, "cms", "TeamMember", id.toString(), "Deleted");
    }

    @Transactional
    public Map<String, Object> uploadMedia(MultipartFile file, String alt, String email) {
        if (file == null || file.isEmpty()) throw new BadRequestException("File is required");
        if (file.getSize() > 50 * 1024 * 1024L) throw new BadRequestException("File exceeds maximum size");
        String path = files.storeFile(file, "media");
        String type = Optional.ofNullable(file.getContentType()).orElse("");
        MediaType mediaType = type.startsWith("image/") ? MediaType.IMAGE : type.startsWith("video/") ? MediaType.VIDEO : MediaType.DOCUMENT;
        MediaFile e = media.save(MediaFile.builder().fileName(path.substring(path.lastIndexOf('/') + 1))
                .originalName(file.getOriginalFilename()).filePath(path).mediaType(mediaType).mimeType(type)
                .fileSize(file.getSize()).alt(alt).uploadedBy(currentUser(email)).build());
        audit.log(currentUser(email), AuditAction.CREATE, "media", "MediaFile", e.getId().toString(), "Uploaded");
        return mapper.media(e);
    }

    @Transactional(readOnly = true)
    public Page<Map<String, Object>> mediaList(Pageable page, MediaType type) {
        Specification<MediaFile> spec = type == null ? Specification.where(null) : equal("mediaType", type);
        return media.findAll(spec, page).map(mapper::media);
    }

    @Transactional(readOnly = true)
    public MediaFile mediaEntity(UUID id) { return media.findById(id).orElseThrow(() -> notFound("Media")); }

    @Transactional
    public void deleteMedia(UUID id, String email) {
        MediaFile e = mediaEntity(id); files.deleteFile(e.getFilePath()); media.delete(e);
        audit.log(currentUser(email), AuditAction.DELETE, "media", "MediaFile", id.toString(), "Deleted");
    }

    @Transactional(readOnly = true)
    public Page<Map<String, Object>> userList(Pageable page, String search, Boolean active) {
        Specification<User> spec = containsAny(search, "email", "firstName", "lastName");
        if (active != null) spec = spec.and(equal("active", active));
        return users.findAll(spec, page).map(mapper::user);
    }

    @Transactional
    public Map<String, Object> saveUser(UUID id, AdminRequests.User r, String email) {
        User e = id == null ? new User() : userEntity(id);
        String normalized = r.email().trim().toLowerCase(Locale.ROOT);
        users.findByEmail(normalized).filter(found -> !found.getId().equals(id)).ifPresent(found -> { throw new BadRequestException("Email already exists"); });
        e.setEmail(normalized); e.setFirstName(r.firstName()); e.setLastName(r.lastName()); e.setPhone(r.phone());
        if (id == null && (r.password() == null || r.password().isBlank())) throw new BadRequestException("Password is required");
        if (r.password() != null && !r.password().isBlank()) e.setPassword(passwordEncoder.encode(r.password()));
        e.setActive(r.active() == null || r.active());
        if (r.roleIds() != null) e.setRoles(new HashSet<>(roles.findAllById(r.roleIds())));
        users.save(e); logSave(email, "users", "User", e.getId(), id == null); return mapper.user(e);
    }

    @Transactional
    public void deleteUser(UUID id, String email) {
        User actor = currentUser(email); if (actor.getId().equals(id)) throw new BadRequestException("You cannot delete your own account");
        users.delete(userEntity(id)); audit.log(actor, AuditAction.DELETE, "users", "User", id.toString(), "Deleted");
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> roleList() { return roles.findAll().stream().map(mapper::role).toList(); }
    @Transactional(readOnly = true)
    public List<Map<String, Object>> permissionList() { return permissions.findAll().stream().map(mapper::permission).toList(); }

    @Transactional
    public Map<String, Object> savePermission(UUID id, AdminRequests.Permission r, String email) {
        Permission e = id == null ? new Permission() : permissions.findById(id).orElseThrow(() -> notFound("Permission"));
        permissions.findByCode(r.code()).filter(found -> !found.getId().equals(id))
                .ifPresent(found -> { throw new BadRequestException("Permission code already exists"); });
        e.setCode(r.code().trim().toLowerCase(Locale.ROOT)); e.setName(r.name());
        e.setDescription(r.description()); e.setModule(r.module()); permissions.save(e);
        logSave(email, "roles", "Permission", e.getId(), id == null); return mapper.permission(e);
    }

    @Transactional
    public void deletePermission(UUID id, String email) {
        Permission e = permissions.findById(id).orElseThrow(() -> notFound("Permission"));
        permissions.delete(e); audit.log(currentUser(email), AuditAction.DELETE, "roles", "Permission", id.toString(), "Deleted");
    }

    @Transactional
    public Map<String, Object> saveRole(UUID id, AdminRequests.Role r, String email) {
        Role e = id == null ? new Role() : roles.findById(id).orElseThrow(() -> notFound("Role"));
        roles.findByName(r.name()).filter(found -> !found.getId().equals(id)).ifPresent(found -> { throw new BadRequestException("Role already exists"); });
        e.setName(r.name().trim().toUpperCase(Locale.ROOT)); e.setDescription(r.description());
        if (r.permissionIds() != null) e.setPermissions(new HashSet<>(permissions.findAllById(r.permissionIds())));
        roles.save(e); logSave(email, "roles", "Role", e.getId(), id == null); return mapper.role(e);
    }

    @Transactional
    public void deleteRole(UUID id, String email) {
        Role e = roles.findById(id).orElseThrow(() -> notFound("Role"));
        if ("SUPER_ADMIN".equals(e.getName())) throw new BadRequestException("SUPER_ADMIN role cannot be deleted");
        roles.delete(e); audit.log(currentUser(email), AuditAction.DELETE, "roles", "Role", id.toString(), "Deleted");
    }

    @Transactional(readOnly = true)
    public Page<Map<String, Object>> auditList(Pageable page, String module, AuditAction action) {
        Specification<AuditLog> spec = Specification.where(null);
        if (module != null && !module.isBlank()) spec = spec.and(equal("module", module));
        if (action != null) spec = spec.and(equal("action", action));
        return auditLogs.findAll(spec, page).map(mapper::audit);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> settingList(String category) {
        Specification<Setting> spec = category == null ? Specification.where(null) : equal("category", category);
        return settings.findAll(spec, org.springframework.data.domain.Sort.by("key")).stream().map(mapper::setting).toList();
    }

    @Transactional
    public Map<String, Object> saveSetting(String key, AdminRequests.Setting r, String email) {
        Setting e = settings.findByKey(key).orElseGet(Setting::new); e.setKey(key); e.setValue(r.value());
        e.setDescription(r.description()); e.setCategory(r.category()); settings.save(e);
        logSave(email, "settings", "Setting", e.getId(), e.getCreatedAt() == null); return mapper.setting(e);
    }

    @Transactional(readOnly = true)
    public Page<Map<String, Object>> notificationList(Pageable page, String email, Boolean read) {
        User user = currentUser(email);
        Specification<Notification> spec = (root, query, cb) -> cb.equal(root.get("user").get("id"), user.getId());
        if (read != null) spec = spec.and(equal("read", read));
        return notifications.findAll(spec, page).map(mapper::notification);
    }

    @Transactional
    public Map<String, Object> createNotification(AdminRequests.Notification r) {
        Notification e = notifications.save(Notification.builder().user(userEntity(r.userId())).title(r.title())
                .message(r.message()).type(r.type()).linkUrl(r.linkUrl()).build());
        return mapper.notification(e);
    }

    @Transactional
    public Map<String, Object> markNotification(UUID id, String email) {
        Notification e = ownNotification(id, email); e.setRead(true); notifications.save(e); return mapper.notification(e);
    }

    @Transactional
    public void deleteNotification(UUID id, String email) { notifications.delete(ownNotification(id, email)); }

    @Transactional(readOnly = true)
    public Page<Map<String, Object>> contactList(Pageable page, Boolean read) {
        Specification<ContactMessage> spec = read == null ? Specification.where(null) : equal("read", read);
        return contacts.findAll(spec, page).map(mapper::contact);
    }

    @Transactional
    public Map<String, Object> markContact(UUID id) {
        ContactMessage e = contacts.findById(id).orElseThrow(() -> notFound("Contact message")); e.setRead(true);
        return mapper.contact(contacts.save(e));
    }

    private BusinessPlan planEntity(UUID id) { return businessPlans.findById(id).orElseThrow(() -> notFound("Business plan")); }
    private Applicant applicantEntity(UUID id) { return applicants.findById(id).orElseThrow(() -> notFound("Applicant")); }
    private User userEntity(UUID id) { return users.findById(id).orElseThrow(() -> notFound("User")); }
    private User currentUser(String email) { return users.findByEmail(email).orElseThrow(() -> notFound("Authenticated user")); }
    private Notification ownNotification(UUID id, String email) {
        Notification e = notifications.findById(id).orElseThrow(() -> notFound("Notification"));
        if (!e.getUser().getEmail().equalsIgnoreCase(email)) throw new ResourceNotFoundException("Notification not found");
        return e;
    }

    private void logSave(String email, String module, String type, UUID id, boolean created) {
        audit.log(currentUser(email), created ? AuditAction.CREATE : AuditAction.UPDATE, module, type, id.toString(), created ? "Created" : "Updated");
    }

    private Map<String, Object> baseNote(BaseEntity note, User author, String content) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", note.getId()); result.put("author", author.getFirstName() + " " + author.getLastName());
        result.put("content", content); result.put("createdAt", note.getCreatedAt()); return result;
    }

    private String uniqueSlug(String requested, String fallback, UUID id) {
        String value = slug(requested == null || requested.isBlank() ? fallback : requested);
        jobs.findBySlug(value).filter(found -> !found.getId().equals(id)).ifPresent(found -> { throw new BadRequestException("Slug already exists"); });
        return value;
    }

    private String slug(String value) {
        String result = value == null ? "" : value.toLowerCase(Locale.ROOT).trim().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
        if (result.isBlank()) throw new BadRequestException("A valid slug is required");
        return result;
    }

    private boolean validPlanTransition(BusinessPlanStatus from, BusinessPlanStatus to) {
        if (from == to) return true;
        return switch (from) {
            case DRAFT -> to == BusinessPlanStatus.SUBMITTED || to == BusinessPlanStatus.ARCHIVED;
            case SUBMITTED -> to == BusinessPlanStatus.REVIEWING || to == BusinessPlanStatus.REJECTED || to == BusinessPlanStatus.ARCHIVED;
            case REVIEWING -> to == BusinessPlanStatus.APPROVED || to == BusinessPlanStatus.REJECTED || to == BusinessPlanStatus.ARCHIVED;
            case APPROVED, REJECTED -> to == BusinessPlanStatus.ARCHIVED || to == BusinessPlanStatus.REVIEWING;
            case ARCHIVED -> false;
        };
    }

    private boolean validApplicantTransition(ApplicantStatus from, ApplicantStatus to) {
        if (from == to) return true;
        return switch (from) {
            case NEW -> to == ApplicantStatus.REVIEWING || to == ApplicantStatus.REJECTED;
            case REVIEWING -> to == ApplicantStatus.INTERVIEW || to == ApplicantStatus.REJECTED;
            case INTERVIEW -> to == ApplicantStatus.OFFER || to == ApplicantStatus.REJECTED;
            case OFFER -> to == ApplicantStatus.HIRED || to == ApplicantStatus.REJECTED;
            case HIRED, REJECTED -> false;
        };
    }

    private <T> Specification<T> containsAny(String search, String... fields) {
        if (search == null || search.isBlank()) return Specification.where(null);
        String pattern = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
        return (root, query, cb) -> cb.or(Arrays.stream(fields)
                .map(field -> cb.like(cb.lower(root.get(field)), pattern)).toArray(jakarta.persistence.criteria.Predicate[]::new));
    }

    private <T> Specification<T> equal(String field, Object value) {
        return (root, query, cb) -> cb.equal(root.get(field), value);
    }

    private ResourceNotFoundException notFound(String item) { return new ResourceNotFoundException(item + " not found"); }
}
