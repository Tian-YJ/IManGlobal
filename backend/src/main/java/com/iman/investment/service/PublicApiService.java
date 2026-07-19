package com.iman.investment.service;

import com.iman.investment.dto.ApplicantDto;
import com.iman.investment.dto.BusinessPlanDto;
import com.iman.investment.dto.ContactDto;
import com.iman.investment.entity.*;
import com.iman.investment.enums.ApplicantStatus;
import com.iman.investment.enums.AuditAction;
import com.iman.investment.enums.BusinessPlanStatus;
import com.iman.investment.enums.ContentStatus;
import com.iman.investment.enums.JobStatus;
import com.iman.investment.exception.BadRequestException;
import com.iman.investment.exception.ResourceNotFoundException;
import com.iman.investment.mapper.ApiMapper;
import com.iman.investment.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PublicApiService {
    private final PortfolioCompanyRepository portfolioRepository;
    private final InsightRepository insightRepository;
    private final TeamMemberRepository teamRepository;
    private final JobRepository jobRepository;
    private final ApplicantRepository applicantRepository;
    private final ApplicantActivityRepository activityRepository;
    private final BusinessPlanRepository businessPlanRepository;
    private final BusinessPlanHistoryRepository historyRepository;
    private final BusinessPlanDocumentRepository documentRepository;
    private final ContactMessageRepository contactRepository;
    private final CmsPageRepository cmsRepository;
    private final FileStorageService files;
    private final AuditLogService audit;
    private final ApiMapper mapper;

    @Transactional(readOnly = true)
    public List<Map<String, Object>> portfolio(String industry, Boolean featured) {
        Specification<PortfolioCompany> spec = (root, query, cb) -> cb.equal(root.get("status"), ContentStatus.PUBLISHED);
        if (industry != null && !industry.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(cb.lower(root.get("industry")), industry.toLowerCase(Locale.ROOT)));
        }
        if (featured != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("featured"), featured));
        }
        return portfolioRepository.findAll(spec, org.springframework.data.domain.Sort.by("displayOrder"))
                .stream().map(mapper::portfolio).toList();
    }

    @Transactional(readOnly = true)
    public Page<Map<String, Object>> insights(String search, Pageable pageable) {
        Specification<Insight> spec = (root, query, cb) -> cb.equal(root.get("status"), ContentStatus.PUBLISHED);
        if (search != null && !search.isBlank()) {
            String p = "%" + search.toLowerCase(Locale.ROOT) + "%";
            spec = spec.and((root, query, cb) -> cb.or(cb.like(cb.lower(root.get("title")), p),
                    cb.like(cb.lower(root.get("excerpt")), p), cb.like(cb.lower(root.get("author")), p)));
        }
        return insightRepository.findAll(spec, pageable).map(mapper::insight);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> insight(String slug) {
        Insight item = insightRepository.findBySlug(slug)
                .filter(i -> i.getStatus() == ContentStatus.PUBLISHED)
                .orElseThrow(() -> new ResourceNotFoundException("Insight not found"));
        return mapper.insight(item);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> team() {
        return teamRepository.findByStatusOrderByDisplayOrderAsc(ContentStatus.PUBLISHED).stream().map(mapper::team).toList();
    }

    @Transactional(readOnly = true)
    public Page<Map<String, Object>> jobs(String search, String department, String location, Pageable pageable) {
        Specification<Job> spec = (root, query, cb) -> cb.equal(root.get("status"), JobStatus.PUBLISHED);
        if (search != null && !search.isBlank()) {
            String p = "%" + search.toLowerCase(Locale.ROOT) + "%";
            spec = spec.and((root, query, cb) -> cb.or(cb.like(cb.lower(root.get("title")), p),
                    cb.like(cb.lower(root.get("description")), p)));
        }
        if (department != null && !department.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(cb.lower(root.get("department")), department.toLowerCase(Locale.ROOT)));
        }
        if (location != null && !location.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(cb.lower(root.get("location")), location.toLowerCase(Locale.ROOT)));
        }
        return jobRepository.findAll(spec, pageable).map(mapper::job);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> job(String slug) {
        return mapper.job(jobRepository.findBySlug(slug).filter(j -> j.getStatus() == JobStatus.PUBLISHED)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found")));
    }

    @Transactional
    public Map<String, Object> apply(UUID jobId, ApplicantDto.Request request, MultipartFile resume,
                                     MultipartFile coverLetterFile) {
        Job job = jobRepository.findById(jobId).filter(j -> j.getStatus() == JobStatus.PUBLISHED)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));
        if (resume == null || resume.isEmpty()) throw new BadRequestException("Resume is required");
        files.validateDocument(resume, Set.of("pdf", "doc", "docx"), 10 * 1024 * 1024L);
        if (coverLetterFile != null && !coverLetterFile.isEmpty()) {
            files.validateDocument(coverLetterFile, Set.of("pdf", "doc", "docx"), 5 * 1024 * 1024L);
        }
        Applicant applicant = Applicant.builder().job(job).firstName(request.getFirstName()).lastName(request.getLastName())
                .email(request.getEmail().trim().toLowerCase(Locale.ROOT)).phone(request.getPhone())
                .linkedinUrl(request.getLinkedinUrl()).coverLetter(request.getCoverLetter())
                .resumeName(resume.getOriginalFilename()).resumePath(files.storeFile(resume, "resumes"))
                .status(ApplicantStatus.NEW).build();
        if (coverLetterFile != null && !coverLetterFile.isEmpty()) {
            applicant.setCoverLetterName(coverLetterFile.getOriginalFilename());
            applicant.setCoverLetterPath(files.storeFile(coverLetterFile, "cover-letters"));
        }
        applicant = applicantRepository.save(applicant);
        activityRepository.save(ApplicantActivity.builder().applicant(applicant).toStatus(ApplicantStatus.NEW)
                .comment("Application submitted").build());
        audit.log(null, AuditAction.CREATE, "applicants", "Applicant", applicant.getId().toString(), "Application submitted");
        return mapper.applicant(applicant);
    }

    @Transactional
    public Map<String, Object> savePlan(BusinessPlanDto.Request request, boolean submit, List<MultipartFile> documents) {
        if (submit && !hasDocuments(documents)) {
            throw new BadRequestException("At least one supporting document is required");
        }
        BusinessPlan plan = copyPlan(new BusinessPlan(), request);
        plan.setStatus(submit ? BusinessPlanStatus.SUBMITTED : BusinessPlanStatus.DRAFT);
        plan = businessPlanRepository.save(plan);
        historyRepository.save(BusinessPlanHistory.builder().businessPlan(plan).toStatus(plan.getStatus())
                .comment(submit ? "Business plan submitted" : "Draft created").build());
        storePlanDocuments(plan, documents);
        audit.log(null, AuditAction.CREATE, "business_plans", "BusinessPlan", plan.getId().toString(),
                submit ? "Business plan submitted" : "Draft saved");
        return mapper.businessPlan(plan);
    }

    @Transactional
    public Map<String, Object> updateDraft(UUID id, String founderEmail, BusinessPlanDto.Request request,
                                           boolean submit, List<MultipartFile> documents) {
        BusinessPlan plan = businessPlanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Business plan not found"));
        if (plan.getStatus() != BusinessPlanStatus.DRAFT || founderEmail == null ||
                !plan.getFounderEmail().equalsIgnoreCase(founderEmail)) {
            throw new BadRequestException("Draft cannot be updated");
        }
        copyPlan(plan, request);
        storePlanDocuments(plan, documents);
        if (submit) {
            if (documentRepository.countByBusinessPlan_Id(plan.getId()) == 0) {
                throw new BadRequestException("At least one supporting document is required");
            }
            plan.setStatus(BusinessPlanStatus.SUBMITTED);
            historyRepository.save(BusinessPlanHistory.builder().businessPlan(plan).fromStatus(BusinessPlanStatus.DRAFT)
                    .toStatus(BusinessPlanStatus.SUBMITTED).comment("Business plan submitted").build());
        } else {
            plan.setStatus(BusinessPlanStatus.DRAFT);
        }
        businessPlanRepository.save(plan);
        return mapper.businessPlan(plan);
    }

    @Transactional
    public Map<String, Object> contact(ContactDto.Request request) {
        ContactMessage message = ContactMessage.builder().name(request.getName())
                .email(request.getEmail().trim().toLowerCase(Locale.ROOT)).phone(request.getPhone())
                .subject(request.getSubject()).message(request.getMessage()).build();
        contactRepository.save(message);
        audit.log(null, AuditAction.CREATE, "contact", "ContactMessage", message.getId().toString(), "Contact form submitted");
        return mapper.contact(message);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> legal(String slug) {
        return mapper.cms(cmsRepository.findBySlug(slug).filter(p -> p.getStatus() == ContentStatus.PUBLISHED)
                .orElseThrow(() -> new ResourceNotFoundException("Page not found")));
    }

    private BusinessPlan copyPlan(BusinessPlan p, BusinessPlanDto.Request r) {
        p.setFounderName(r.getFounderName()); p.setFounderPosition(r.getFounderPosition()); p.setFounderEmail(r.getFounderEmail().trim().toLowerCase(Locale.ROOT));
        p.setFounderPhone(r.getFounderPhone()); p.setCountry(r.getCountry()); p.setLinkedinUrl(r.getLinkedinUrl()); p.setWebsite(r.getWebsite());
        p.setCompanyName(r.getCompanyName()); p.setIndustry(r.getIndustry()); p.setStage(r.getStage()); p.setTeamSize(r.getTeamSize());
        p.setFoundedDate(r.getFoundedDate()); p.setFundingAmount(r.getFundingAmount()); p.setRevenue(r.getRevenue());
        p.setMonthlyGrowth(r.getMonthlyGrowth()); p.setCompanyDescription(r.getCompanyDescription());
        if (r.getCurrentStep() != null) p.setCurrentStep(Math.max(1, Math.min(10, r.getCurrentStep())));
        return p;
    }

    private void storePlanDocuments(BusinessPlan plan, List<MultipartFile> documents) {
        if (documents == null) return;
        for (MultipartFile file : documents) {
            if (file == null || file.isEmpty()) continue;
            files.validateDocument(file, Set.of("pdf", "ppt", "pptx", "doc", "docx"), 50 * 1024 * 1024L);
            String path = files.storeFile(file, "business-plans");
            documentRepository.save(BusinessPlanDocument.builder().businessPlan(plan).fileName(path.substring(path.lastIndexOf('/') + 1))
                    .originalName(file.getOriginalFilename()).filePath(path).fileType(files.extension(file.getOriginalFilename()).toUpperCase(Locale.ROOT))
                    .fileSize(file.getSize()).mimeType(file.getContentType()).build());
        }
    }

    private boolean hasDocuments(List<MultipartFile> documents) {
        if (documents == null || documents.isEmpty()) return false;
        return documents.stream().anyMatch(file -> file != null && !file.isEmpty());
    }
}
