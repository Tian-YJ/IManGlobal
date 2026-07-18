package com.iman.investment.service;

import com.iman.investment.dto.BusinessPlanDto;
import com.iman.investment.dto.PageResponse;
import com.iman.investment.entity.BusinessPlan;
import com.iman.investment.entity.BusinessPlanDocument;
import com.iman.investment.entity.BusinessPlanHistory;
import com.iman.investment.entity.User;
import com.iman.investment.enums.AuditAction;
import com.iman.investment.enums.BusinessPlanStatus;
import com.iman.investment.exception.ResourceNotFoundException;
import com.iman.investment.repository.BusinessPlanRepository;
import com.iman.investment.repository.UserRepository;
import com.iman.investment.util.PageUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BusinessPlanService {

    private final BusinessPlanRepository businessPlanRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final AuditLogService auditLogService;

    @Transactional
    public BusinessPlanDto.Response create(BusinessPlanDto.Request request) {
        BusinessPlan plan = mapToEntity(new BusinessPlan(), request);
        if (plan.getStatus() == null) {
            plan.setStatus(BusinessPlanStatus.SUBMITTED);
        }
        plan = businessPlanRepository.save(plan);
        addHistory(plan, null, plan.getStatus(), null, "Business plan submitted");
        auditLogService.log(null, AuditAction.CREATE, "business_plans", "BusinessPlan", plan.getId().toString(), "New business plan submitted");
        return toResponse(plan);
    }

    @Transactional
    public BusinessPlanDto.Response saveDraft(BusinessPlanDto.Request request) {
        BusinessPlan plan = mapToEntity(new BusinessPlan(), request);
        plan.setStatus(BusinessPlanStatus.DRAFT);
        plan = businessPlanRepository.save(plan);
        return toResponse(plan);
    }

    @Transactional(readOnly = true)
    public PageResponse<BusinessPlanDto.Response> findAll(int page, int size, String sortBy, String direction, String search, BusinessPlanStatus status) {
        Specification<BusinessPlan> spec = Specification.where(null);
        if (search != null && !search.isBlank()) {
            String pattern = "%" + search.toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("companyName")), pattern),
                    cb.like(cb.lower(root.get("founderName")), pattern),
                    cb.like(cb.lower(root.get("founderEmail")), pattern)
            ));
        }
        if (status != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        Page<BusinessPlan> result = businessPlanRepository.findAll(spec, PageUtils.createPageable(page, size, sortBy, direction));
        return PageResponse.from(result.map(this::toResponse));
    }

    @Transactional(readOnly = true)
    public BusinessPlanDto.Response findById(UUID id) {
        return toResponse(getById(id));
    }

    @Transactional
    public BusinessPlanDto.Response update(UUID id, BusinessPlanDto.Request request) {
        BusinessPlan plan = getById(id);
        mapToEntity(plan, request);
        return toResponse(businessPlanRepository.save(plan));
    }

    @Transactional
    public BusinessPlanDto.Response updateStatus(UUID id, BusinessPlanDto.StatusUpdate update, String userEmail) {
        BusinessPlan plan = getById(id);
        BusinessPlanStatus oldStatus = plan.getStatus();
        plan.setStatus(update.getStatus());
        plan = businessPlanRepository.save(plan);
        User user = userEmail != null ? userRepository.findByEmail(userEmail).orElse(null) : null;
        addHistory(plan, oldStatus, update.getStatus(), user, update.getComment());
        auditLogService.log(user, AuditAction.UPDATE, "business_plans", "BusinessPlan", id.toString(), "Status changed to " + update.getStatus());
        return toResponse(plan);
    }

    @Transactional
    public void uploadDocument(UUID id, MultipartFile file) {
        BusinessPlan plan = getById(id);
        String path = fileStorageService.storeFile(file, "business-plans");
        BusinessPlanDocument doc = BusinessPlanDocument.builder()
                .businessPlan(plan)
                .fileName(path.substring(path.lastIndexOf('/') + 1))
                .originalName(file.getOriginalFilename())
                .filePath(path)
                .fileType(getFileType(file.getOriginalFilename()))
                .fileSize(file.getSize())
                .mimeType(file.getContentType())
                .build();
        plan.getDocuments().add(doc);
        businessPlanRepository.save(plan);
    }

    @Transactional
    public void delete(UUID id) {
        businessPlanRepository.delete(getById(id));
    }

    private BusinessPlan getById(UUID id) {
        return businessPlanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Business plan not found: " + id));
    }

    private void addHistory(BusinessPlan plan, BusinessPlanStatus from, BusinessPlanStatus to, User user, String comment) {
        BusinessPlanHistory history = BusinessPlanHistory.builder()
                .businessPlan(plan)
                .fromStatus(from)
                .toStatus(to)
                .changedBy(user)
                .comment(comment)
                .build();
        plan.getHistory().add(history);
    }

    private BusinessPlan mapToEntity(BusinessPlan plan, BusinessPlanDto.Request request) {
        plan.setFounderName(request.getFounderName());
        plan.setFounderPosition(request.getFounderPosition());
        plan.setFounderEmail(request.getFounderEmail());
        plan.setFounderPhone(request.getFounderPhone());
        plan.setCountry(request.getCountry());
        plan.setLinkedinUrl(request.getLinkedinUrl());
        plan.setWebsite(request.getWebsite());
        plan.setCompanyName(request.getCompanyName());
        plan.setIndustry(request.getIndustry());
        plan.setStage(request.getStage());
        plan.setTeamSize(request.getTeamSize());
        plan.setFoundedDate(request.getFoundedDate());
        plan.setFundingAmount(request.getFundingAmount());
        plan.setRevenue(request.getRevenue());
        plan.setMonthlyGrowth(request.getMonthlyGrowth());
        plan.setCompanyDescription(request.getCompanyDescription());
        if (request.getStatus() != null) plan.setStatus(request.getStatus());
        if (request.getCurrentStep() != null) plan.setCurrentStep(request.getCurrentStep());
        return plan;
    }

    private BusinessPlanDto.Response toResponse(BusinessPlan plan) {
        BusinessPlanDto.Response response = new BusinessPlanDto.Response();
        response.setId(plan.getId());
        response.setFounderName(plan.getFounderName());
        response.setFounderPosition(plan.getFounderPosition());
        response.setFounderEmail(plan.getFounderEmail());
        response.setFounderPhone(plan.getFounderPhone());
        response.setCountry(plan.getCountry());
        response.setLinkedinUrl(plan.getLinkedinUrl());
        response.setWebsite(plan.getWebsite());
        response.setCompanyName(plan.getCompanyName());
        response.setIndustry(plan.getIndustry());
        response.setStage(plan.getStage());
        response.setTeamSize(plan.getTeamSize());
        response.setFoundedDate(plan.getFoundedDate());
        response.setFundingAmount(plan.getFundingAmount());
        response.setRevenue(plan.getRevenue());
        response.setMonthlyGrowth(plan.getMonthlyGrowth());
        response.setCompanyDescription(plan.getCompanyDescription());
        response.setStatus(plan.getStatus());
        response.setCurrentStep(plan.getCurrentStep());
        if (plan.getAssignedTo() != null) {
            response.setAssignedToName(plan.getAssignedTo().getFirstName() + " " + plan.getAssignedTo().getLastName());
        }
        response.setCreatedAt(plan.getCreatedAt());
        response.setUpdatedAt(plan.getUpdatedAt());
        return response;
    }

    private String getFileType(String filename) {
        if (filename == null) return "OTHER";
        String lower = filename.toLowerCase();
        if (lower.endsWith(".pdf")) return "PDF";
        if (lower.endsWith(".ppt") || lower.endsWith(".pptx")) return "PPT";
        if (lower.endsWith(".doc") || lower.endsWith(".docx")) return "DOCX";
        return "OTHER";
    }
}
