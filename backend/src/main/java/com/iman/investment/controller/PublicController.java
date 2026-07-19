package com.iman.investment.controller;

import com.iman.investment.dto.ApplicantDto;
import com.iman.investment.dto.BusinessPlanDto;
import com.iman.investment.dto.ContactDto;
import com.iman.investment.dto.PageResponse;
import com.iman.investment.service.PublicApiService;
import com.iman.investment.util.PageUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/public")
@RequiredArgsConstructor
@Tag(name = "Public APIs")
public class PublicController {
    private final PublicApiService service;

    @GetMapping("/portfolio")
    public List<Map<String, Object>> portfolio(@RequestParam(required = false) String industry,
                                               @RequestParam(required = false) Boolean featured) {
        return service.portfolio(industry, featured);
    }

    @GetMapping("/insights")
    public PageResponse<Map<String, Object>> insights(@RequestParam(defaultValue = "0") int page,
                                                       @RequestParam(defaultValue = "20") int size,
                                                       @RequestParam(defaultValue = "publishedDate") String sort,
                                                       @RequestParam(defaultValue = "desc") String direction,
                                                       @RequestParam(required = false) String search) {
        return PageResponse.from(service.insights(search, PageUtils.createPageable(page, size, sort, direction)));
    }

    @GetMapping("/insights/{slug}")
    public Map<String, Object> insight(@PathVariable String slug) { return service.insight(slug); }

    @GetMapping("/team")
    public List<Map<String, Object>> team() { return service.team(); }

    @GetMapping("/jobs")
    public PageResponse<Map<String, Object>> jobs(@RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "20") int size,
                                                  @RequestParam(defaultValue = "datePosted") String sort,
                                                  @RequestParam(defaultValue = "desc") String direction,
                                                  @RequestParam(required = false) String search,
                                                  @RequestParam(required = false) String department,
                                                  @RequestParam(required = false) String location) {
        return PageResponse.from(service.jobs(search, department, location, PageUtils.createPageable(page, size, sort, direction)));
    }

    @GetMapping("/jobs/{slug}")
    public Map<String, Object> job(@PathVariable String slug) { return service.job(slug); }

    @PostMapping(value = "/jobs/{jobId}/applications", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Apply to a published job")
    public Map<String, Object> apply(@PathVariable UUID jobId,
                                     @Valid @RequestPart("application") ApplicantDto.Request application,
                                     @RequestPart(value = "resume", required = false) MultipartFile resume,
                                     @RequestPart(value = "coverLetter", required = false) MultipartFile coverLetter) {
        return service.apply(jobId, application, resume, coverLetter);
    }

    @PostMapping(value = "/business-plans", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> submitPlan(@Valid @RequestPart("plan") BusinessPlanDto.Request plan,
                                          @RequestPart(value = "documents", required = false) List<MultipartFile> documents,
                                          @RequestParam(defaultValue = "true") boolean submit) {
        return service.savePlan(plan, submit, documents);
    }

    @PutMapping(value = "/business-plans/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> updateDraft(@PathVariable UUID id, @RequestParam String founderEmail,
                                           @Valid @RequestPart("plan") BusinessPlanDto.Request plan,
                                           @RequestPart(value = "documents", required = false) List<MultipartFile> documents,
                                           @RequestParam(defaultValue = "false") boolean submit) {
        return service.updateDraft(id, founderEmail, plan, submit, documents);
    }

    @PostMapping("/contact")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> contact(@Valid @RequestBody ContactDto.Request request) { return service.contact(request); }

    @GetMapping("/legal/{slug}")
    public Map<String, Object> legal(@PathVariable String slug) { return service.legal(slug); }
}
