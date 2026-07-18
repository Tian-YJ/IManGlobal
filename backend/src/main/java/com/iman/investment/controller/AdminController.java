package com.iman.investment.controller;

import com.iman.investment.dto.*;
import com.iman.investment.entity.Applicant;
import com.iman.investment.entity.BusinessPlanDocument;
import com.iman.investment.entity.MediaFile;
import com.iman.investment.enums.*;
import com.iman.investment.service.AdminApiService;
import com.iman.investment.service.DashboardService;
import com.iman.investment.service.FileStorageService;
import com.iman.investment.util.PageUtils;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@Tag(name = "Administration")
public class AdminController {
    private final AdminApiService service;
    private final DashboardService dashboard;
    private final FileStorageService files;

    @GetMapping("/dashboard")
    @PreAuthorize("hasAuthority('dashboard.view')")
    public DashboardStatsResponse dashboard() { return dashboard.getStats(); }

    @GetMapping("/business-plans")
    @PreAuthorize("hasAuthority('business_plans.manage')")
    public PageResponse<Map<String, Object>> plans(PageQuery q, @RequestParam(required = false) String search,
                                                   @RequestParam(required = false) BusinessPlanStatus status) {
        return PageResponse.from(service.plans(q.pageable(), search, status));
    }

    @GetMapping("/business-plans/{id}")
    @PreAuthorize("hasAuthority('business_plans.manage')")
    public Map<String, Object> plan(@PathVariable UUID id) { return service.plan(id); }

    @PatchMapping("/business-plans/{id}/status")
    @PreAuthorize("hasAuthority('business_plans.manage')")
    public Map<String, Object> planStatus(@PathVariable UUID id, @Valid @RequestBody AdminRequests.BusinessPlanStatusChange r,
                                          Authentication auth) { return service.planStatus(id, r, auth.getName()); }

    @PatchMapping("/business-plans/{id}/assignment")
    @PreAuthorize("hasAuthority('business_plans.manage')")
    public Map<String, Object> assignPlan(@PathVariable UUID id, @Valid @RequestBody AdminRequests.Assignment r,
                                          Authentication auth) { return service.assignPlan(id, r.userId(), auth.getName()); }

    @PostMapping("/business-plans/{id}/notes")
    @PreAuthorize("hasAuthority('business_plans.manage')")
    public Map<String, Object> planNote(@PathVariable UUID id, @Valid @RequestBody AdminRequests.Note r,
                                        Authentication auth) { return service.addPlanNote(id, r.content(), auth.getName()); }

    @GetMapping("/business-plans/{id}/notes")
    @PreAuthorize("hasAuthority('business_plans.manage')")
    public List<Map<String, Object>> planNotes(@PathVariable UUID id) { return service.planNotes(id); }

    @GetMapping("/business-plans/{id}/history")
    @PreAuthorize("hasAuthority('business_plans.manage')")
    public List<Map<String, Object>> planHistory(@PathVariable UUID id) { return service.planHistory(id); }

    @GetMapping("/business-plans/{planId}/documents/{documentId}")
    @PreAuthorize("hasAuthority('business_plans.manage')")
    public ResponseEntity<Resource> planDocument(@PathVariable UUID planId, @PathVariable UUID documentId) throws MalformedURLException {
        BusinessPlanDocument item = service.planDocument(planId, documentId);
        return download(item.getFilePath(), item.getOriginalName(), item.getMimeType());
    }

    @DeleteMapping("/business-plans/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('business_plans.manage')")
    public void deletePlan(@PathVariable UUID id, Authentication auth) { service.deletePlan(id, auth.getName()); }

    @GetMapping("/portfolio")
    @PreAuthorize("hasAuthority('portfolio.manage')")
    public PageResponse<Map<String, Object>> portfolio(PageQuery q, @RequestParam(required = false) String search,
                                                       @RequestParam(required = false) ContentStatus status) {
        return PageResponse.from(service.portfolios(q.pageable(), search, status));
    }

    @GetMapping("/portfolio/{id}")
    @PreAuthorize("hasAuthority('portfolio.manage')")
    public Map<String, Object> portfolio(@PathVariable UUID id) { return service.portfolio(id); }

    @PostMapping("/portfolio")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('portfolio.manage')")
    public Map<String, Object> createPortfolio(@Valid @RequestBody PortfolioDto.Request r, Authentication auth) {
        return service.savePortfolio(null, r, auth.getName());
    }

    @PutMapping("/portfolio/{id}")
    @PreAuthorize("hasAuthority('portfolio.manage')")
    public Map<String, Object> updatePortfolio(@PathVariable UUID id, @Valid @RequestBody PortfolioDto.Request r, Authentication auth) {
        return service.savePortfolio(id, r, auth.getName());
    }

    @DeleteMapping("/portfolio/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('portfolio.manage')")
    public void deletePortfolio(@PathVariable UUID id, Authentication auth) { service.deletePortfolio(id, auth.getName()); }

    @GetMapping("/jobs")
    @PreAuthorize("hasAuthority('jobs.manage')")
    public PageResponse<Map<String, Object>> jobs(PageQuery q, @RequestParam(required = false) String search,
                                                  @RequestParam(required = false) JobStatus status) {
        return PageResponse.from(service.jobList(q.pageable(), search, status));
    }

    @GetMapping("/jobs/{id}")
    @PreAuthorize("hasAuthority('jobs.manage')")
    public Map<String, Object> job(@PathVariable UUID id) { return service.job(id); }

    @PostMapping("/jobs")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('jobs.manage')")
    public Map<String, Object> createJob(@Valid @RequestBody JobDto.Request r, Authentication auth) {
        return service.saveJob(null, r, auth.getName());
    }

    @PutMapping("/jobs/{id}")
    @PreAuthorize("hasAuthority('jobs.manage')")
    public Map<String, Object> updateJob(@PathVariable UUID id, @Valid @RequestBody JobDto.Request r, Authentication auth) {
        return service.saveJob(id, r, auth.getName());
    }

    @DeleteMapping("/jobs/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('jobs.manage')")
    public void deleteJob(@PathVariable UUID id, Authentication auth) { service.deleteJob(id, auth.getName()); }

    @GetMapping("/applicants")
    @PreAuthorize("hasAuthority('applicants.manage')")
    public PageResponse<Map<String, Object>> applicants(PageQuery q, @RequestParam(required = false) String search,
                                                        @RequestParam(required = false) ApplicantStatus status,
                                                        @RequestParam(required = false) UUID jobId) {
        return PageResponse.from(service.applicantList(q.pageable(), search, status, jobId));
    }

    @GetMapping("/applicants/{id}")
    @PreAuthorize("hasAuthority('applicants.manage')")
    public Map<String, Object> applicant(@PathVariable UUID id) { return service.applicant(id); }

    @GetMapping("/applicants/{id}/resume")
    @PreAuthorize("hasAuthority('applicants.manage')")
    public ResponseEntity<Resource> applicantResume(@PathVariable UUID id) throws MalformedURLException {
        Applicant item = service.applicantFile(id);
        return download(item.getResumePath(), item.getResumeName(), null);
    }

    @GetMapping("/applicants/{id}/cover-letter")
    @PreAuthorize("hasAuthority('applicants.manage')")
    public ResponseEntity<Resource> applicantCoverLetter(@PathVariable UUID id) throws MalformedURLException {
        Applicant item = service.applicantFile(id);
        return download(item.getCoverLetterPath(), item.getCoverLetterName(), null);
    }

    @PatchMapping("/applicants/{id}/status")
    @PreAuthorize("hasAuthority('applicants.manage')")
    public Map<String, Object> applicantStatus(@PathVariable UUID id, @Valid @RequestBody AdminRequests.ApplicantStatusChange r,
                                               Authentication auth) { return service.applicantStatus(id, r, auth.getName()); }

    @PostMapping("/applicants/{id}/notes")
    @PreAuthorize("hasAuthority('applicants.manage')")
    public Map<String, Object> applicantNote(@PathVariable UUID id, @Valid @RequestBody AdminRequests.Note r,
                                             Authentication auth) { return service.addApplicantNote(id, r.content(), auth.getName()); }

    @GetMapping("/cms/pages")
    @PreAuthorize("hasAuthority('cms.manage')")
    public PageResponse<Map<String, Object>> cms(PageQuery q, @RequestParam(required = false) String search,
                                                 @RequestParam(required = false) ContentStatus status) {
        return PageResponse.from(service.cmsList(q.pageable(), search, status));
    }

    @PostMapping("/cms/pages")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('cms.manage')")
    public Map<String, Object> createCms(@Valid @RequestBody AdminRequests.CmsPage r, Authentication auth) {
        return service.saveCms(null, r, auth.getName());
    }

    @PutMapping("/cms/pages/{id}")
    @PreAuthorize("hasAuthority('cms.manage')")
    public Map<String, Object> updateCms(@PathVariable UUID id, @Valid @RequestBody AdminRequests.CmsPage r, Authentication auth) {
        return service.saveCms(id, r, auth.getName());
    }

    @DeleteMapping("/cms/pages/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('cms.manage')")
    public void deleteCms(@PathVariable UUID id, Authentication auth) { service.deleteCms(id, auth.getName()); }

    @GetMapping("/cms/insights")
    @PreAuthorize("hasAuthority('cms.manage')")
    public PageResponse<Map<String, Object>> insights(PageQuery q, @RequestParam(required = false) String search,
                                                      @RequestParam(required = false) ContentStatus status) {
        return PageResponse.from(service.insightList(q.pageable(), search, status));
    }

    @PostMapping("/cms/insights")
    @PreAuthorize("hasAuthority('cms.manage')")
    public Map<String, Object> createInsight(@Valid @RequestBody InsightDto.Request r, Authentication auth) {
        return service.saveInsight(null, r, auth.getName());
    }

    @PutMapping("/cms/insights/{id}")
    @PreAuthorize("hasAuthority('cms.manage')")
    public Map<String, Object> updateInsight(@PathVariable UUID id, @Valid @RequestBody InsightDto.Request r, Authentication auth) {
        return service.saveInsight(id, r, auth.getName());
    }

    @DeleteMapping("/cms/insights/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('cms.manage')")
    public void deleteInsight(@PathVariable UUID id, Authentication auth) { service.deleteInsight(id, auth.getName()); }

    @GetMapping("/cms/team")
    @PreAuthorize("hasAuthority('cms.manage')")
    public PageResponse<Map<String, Object>> team(PageQuery q, @RequestParam(required = false) String search,
                                                  @RequestParam(required = false) ContentStatus status) {
        return PageResponse.from(service.teamList(q.pageable(), search, status));
    }

    @PostMapping("/cms/team")
    @PreAuthorize("hasAuthority('cms.manage')")
    public Map<String, Object> createTeam(@Valid @RequestBody TeamMemberDto.Request r, Authentication auth) {
        return service.saveTeam(null, r, auth.getName());
    }

    @PutMapping("/cms/team/{id}")
    @PreAuthorize("hasAuthority('cms.manage')")
    public Map<String, Object> updateTeam(@PathVariable UUID id, @Valid @RequestBody TeamMemberDto.Request r, Authentication auth) {
        return service.saveTeam(id, r, auth.getName());
    }

    @DeleteMapping("/cms/team/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('cms.manage')")
    public void deleteTeam(@PathVariable UUID id, Authentication auth) { service.deleteTeam(id, auth.getName()); }

    @GetMapping("/media")
    @PreAuthorize("hasAuthority('media.manage')")
    public PageResponse<Map<String, Object>> media(PageQuery q, @RequestParam(required = false) com.iman.investment.enums.MediaType type) {
        return PageResponse.from(service.mediaList(q.pageable(), type));
    }

    @PostMapping(value = "/media", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('media.manage')")
    public Map<String, Object> uploadMedia(@RequestPart MultipartFile file, @RequestParam(required = false) String alt,
                                           Authentication auth) { return service.uploadMedia(file, alt, auth.getName()); }

    @GetMapping("/media/{id}/download")
    @PreAuthorize("hasAuthority('media.manage')")
    public ResponseEntity<Resource> downloadMedia(@PathVariable UUID id) throws MalformedURLException {
        MediaFile item = service.mediaEntity(id);
        return download(item.getFilePath(), item.getOriginalName(), item.getMimeType());
    }

    @DeleteMapping("/media/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('media.manage')")
    public void deleteMedia(@PathVariable UUID id, Authentication auth) { service.deleteMedia(id, auth.getName()); }

    @GetMapping("/users")
    @PreAuthorize("hasAuthority('users.manage')")
    public PageResponse<Map<String, Object>> users(PageQuery q, @RequestParam(required = false) String search,
                                                   @RequestParam(required = false) Boolean active) {
        return PageResponse.from(service.userList(q.pageable(), search, active));
    }

    @PostMapping("/users")
    @PreAuthorize("hasAuthority('users.manage')")
    public Map<String, Object> createUser(@Valid @RequestBody AdminRequests.User r, Authentication auth) {
        return service.saveUser(null, r, auth.getName());
    }

    @PutMapping("/users/{id}")
    @PreAuthorize("hasAuthority('users.manage')")
    public Map<String, Object> updateUser(@PathVariable UUID id, @Valid @RequestBody AdminRequests.User r, Authentication auth) {
        return service.saveUser(id, r, auth.getName());
    }

    @DeleteMapping("/users/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('users.manage')")
    public void deleteUser(@PathVariable UUID id, Authentication auth) { service.deleteUser(id, auth.getName()); }

    @GetMapping("/roles")
    @PreAuthorize("hasAuthority('roles.manage')")
    public List<Map<String, Object>> roles() { return service.roleList(); }

    @PostMapping("/roles")
    @PreAuthorize("hasAuthority('roles.manage')")
    public Map<String, Object> createRole(@Valid @RequestBody AdminRequests.Role r, Authentication auth) {
        return service.saveRole(null, r, auth.getName());
    }

    @PutMapping("/roles/{id}")
    @PreAuthorize("hasAuthority('roles.manage')")
    public Map<String, Object> updateRole(@PathVariable UUID id, @Valid @RequestBody AdminRequests.Role r, Authentication auth) {
        return service.saveRole(id, r, auth.getName());
    }

    @DeleteMapping("/roles/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('roles.manage')")
    public void deleteRole(@PathVariable UUID id, Authentication auth) { service.deleteRole(id, auth.getName()); }

    @GetMapping("/permissions")
    @PreAuthorize("hasAuthority('roles.manage')")
    public List<Map<String, Object>> permissions() { return service.permissionList(); }

    @PostMapping("/permissions")
    @PreAuthorize("hasAuthority('roles.manage')")
    public Map<String, Object> createPermission(@Valid @RequestBody AdminRequests.Permission r, Authentication auth) {
        return service.savePermission(null, r, auth.getName());
    }

    @PutMapping("/permissions/{id}")
    @PreAuthorize("hasAuthority('roles.manage')")
    public Map<String, Object> updatePermission(@PathVariable UUID id, @Valid @RequestBody AdminRequests.Permission r, Authentication auth) {
        return service.savePermission(id, r, auth.getName());
    }

    @DeleteMapping("/permissions/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('roles.manage')")
    public void deletePermission(@PathVariable UUID id, Authentication auth) { service.deletePermission(id, auth.getName()); }

    @GetMapping("/audit-logs")
    @PreAuthorize("hasAuthority('audit.view')")
    public PageResponse<Map<String, Object>> audit(PageQuery q, @RequestParam(required = false) String module,
                                                   @RequestParam(required = false) AuditAction action) {
        return PageResponse.from(service.auditList(q.pageable(), module, action));
    }

    @GetMapping("/settings")
    @PreAuthorize("hasAuthority('settings.manage')")
    public List<Map<String, Object>> settings(@RequestParam(required = false) String category) { return service.settingList(category); }

    @PutMapping("/settings/{key}")
    @PreAuthorize("hasAuthority('settings.manage')")
    public Map<String, Object> setting(@PathVariable String key, @Valid @RequestBody AdminRequests.Setting r, Authentication auth) {
        return service.saveSetting(key, r, auth.getName());
    }

    @GetMapping("/notifications")
    public PageResponse<Map<String, Object>> notifications(PageQuery q, @RequestParam(required = false) Boolean read, Authentication auth) {
        return PageResponse.from(service.notificationList(q.pageable(), auth.getName(), read));
    }

    @PostMapping("/notifications")
    @PreAuthorize("hasAnyAuthority('users.manage','settings.manage')")
    public Map<String, Object> createNotification(@Valid @RequestBody AdminRequests.Notification r) { return service.createNotification(r); }

    @PatchMapping("/notifications/{id}/read")
    public Map<String, Object> readNotification(@PathVariable UUID id, Authentication auth) {
        return service.markNotification(id, auth.getName());
    }

    @DeleteMapping("/notifications/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteNotification(@PathVariable UUID id, Authentication auth) { service.deleteNotification(id, auth.getName()); }

    @GetMapping("/contact-messages")
    @PreAuthorize("hasAuthority('cms.manage')")
    public PageResponse<Map<String, Object>> contacts(PageQuery q, @RequestParam(required = false) Boolean read) {
        return PageResponse.from(service.contactList(q.pageable(), read));
    }

    @PatchMapping("/contact-messages/{id}/read")
    @PreAuthorize("hasAuthority('cms.manage')")
    public Map<String, Object> readContact(@PathVariable UUID id) { return service.markContact(id); }

    private org.springframework.http.MediaType safeMediaType(String value) {
        try { return value == null ? org.springframework.http.MediaType.APPLICATION_OCTET_STREAM : org.springframework.http.MediaType.parseMediaType(value); }
        catch (InvalidMediaTypeException ex) { return org.springframework.http.MediaType.APPLICATION_OCTET_STREAM; }
    }

    private ResponseEntity<Resource> download(String filePath, String name, String mimeType) throws MalformedURLException {
        Path path = files.loadFile(filePath);
        return ResponseEntity.ok().contentType(safeMediaType(mimeType))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(name).build().toString())
                .body(new UrlResource(path.toUri()));
    }

    public record PageQuery(Integer page, Integer size, String sort, String direction) {
        public org.springframework.data.domain.Pageable pageable() {
            return PageUtils.createPageable(page == null ? 0 : page, size == null ? 20 : size,
                    sort == null ? "createdAt" : sort, direction == null ? "desc" : direction);
        }
    }
}
