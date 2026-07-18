package com.iman.investment.service;

import com.iman.investment.dto.DashboardStatsResponse;
import com.iman.investment.enums.ApplicantStatus;
import com.iman.investment.enums.BusinessPlanStatus;
import com.iman.investment.enums.ContentStatus;
import com.iman.investment.enums.JobStatus;
import com.iman.investment.repository.ApplicantRepository;
import com.iman.investment.repository.AuditLogRepository;
import com.iman.investment.repository.BusinessPlanRepository;
import com.iman.investment.repository.ContactMessageRepository;
import com.iman.investment.repository.JobRepository;
import com.iman.investment.repository.PortfolioCompanyRepository;
import com.iman.investment.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final BusinessPlanRepository businessPlanRepository;
    private final PortfolioCompanyRepository portfolioCompanyRepository;
    private final JobRepository jobRepository;
    private final ApplicantRepository applicantRepository;
    private final ContactMessageRepository contactMessageRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;

    @Transactional(readOnly = true)
    public DashboardStatsResponse getStats() {
        Map<String, Long> bpCounts = new LinkedHashMap<>();
        for (BusinessPlanStatus status : BusinessPlanStatus.values()) {
            bpCounts.put(status.name(), businessPlanRepository.countByStatus(status));
        }
        Map<String, Long> applicantCounts = new LinkedHashMap<>();
        for (ApplicantStatus status : ApplicantStatus.values()) {
            applicantCounts.put(status.name(), applicantRepository.countByStatus(status));
        }

        Instant weekAgo = Instant.now().minus(7, ChronoUnit.DAYS);
        Instant twoWeeksAgo = Instant.now().minus(14, ChronoUnit.DAYS);

        long totalVisitors = applicantRepository.count() + businessPlanRepository.count() + contactMessageRepository.count();
        long newBusinessPlans = businessPlanRepository.countByStatus(BusinessPlanStatus.SUBMITTED)
                + businessPlanRepository.countByStatus(BusinessPlanStatus.REVIEWING);
        long businessConversions = businessPlanRepository.countByStatus(BusinessPlanStatus.APPROVED);
        long totalUsers = userRepository.count();
        long systemLogs = auditLogRepository.count();

        Map<String, Integer> trends = new LinkedHashMap<>();
        trends.put("totalVisitors", trend(
                engagementSince(weekAgo),
                engagementBetween(twoWeeksAgo, weekAgo)));
        trends.put("newApplications", trend(
                applicantRepository.countByCreatedAtGreaterThanEqual(weekAgo),
                applicantsBetween(twoWeeksAgo, weekAgo)));
        trends.put("activeJobs", trend(
                jobRepository.findByStatusOrderByDatePostedDesc(JobStatus.PUBLISHED).size(),
                jobRepository.findByStatusOrderByDatePostedDesc(JobStatus.PUBLISHED).size()));
        trends.put("newBusinessPlans", trend(
                businessPlanRepository.countByCreatedAtGreaterThanEqual(weekAgo),
                businessPlansBetween(twoWeeksAgo, weekAgo)));
        trends.put("businessConversions", trend(
                businessPlanRepository.countByStatus(BusinessPlanStatus.APPROVED),
                businessPlanRepository.countByStatus(BusinessPlanStatus.APPROVED)));
        trends.put("newUsers", trend(
                userRepository.countByCreatedAtGreaterThanEqual(weekAgo),
                usersBetween(twoWeeksAgo, weekAgo)));
        trends.put("systemLogs", trend(
                auditLogRepository.countByCreatedAtGreaterThanEqual(weekAgo),
                auditLogsBetween(twoWeeksAgo, weekAgo)));

        List<String> visitorLabels = new ArrayList<>();
        List<Long> visitorSeries = new ArrayList<>();
        ZoneId zone = ZoneId.systemDefault();
        DateTimeFormatter labelFormat = DateTimeFormatter.ofPattern("EEE", java.util.Locale.ENGLISH);
        for (int offset = 6; offset >= 0; offset--) {
            LocalDate day = LocalDate.now(zone).minusDays(offset);
            Instant start = day.atStartOfDay(zone).toInstant();
            Instant end = day.plusDays(1).atStartOfDay(zone).toInstant();
            visitorLabels.add(day.format(labelFormat));
            visitorSeries.add(auditLogRepository.countByCreatedAtBetween(start, end));
        }

        return DashboardStatsResponse.builder()
                .totalBusinessPlans(businessPlanRepository.count())
                .reviewingBusinessPlans(businessPlanRepository.countByStatus(BusinessPlanStatus.REVIEWING))
                .approvedBusinessPlans(businessPlanRepository.countByStatus(BusinessPlanStatus.APPROVED))
                .rejectedBusinessPlans(businessPlanRepository.countByStatus(BusinessPlanStatus.REJECTED))
                .activePortfolio(portfolioCompanyRepository.findByStatusOrderByDisplayOrderAsc(ContentStatus.PUBLISHED).size())
                .openJobs(jobRepository.findByStatusOrderByDatePostedDesc(JobStatus.PUBLISHED).size())
                .totalApplicants(applicantRepository.count())
                .newApplicants(applicantRepository.countByStatus(ApplicantStatus.NEW))
                .interviewingApplicants(applicantRepository.countByStatus(ApplicantStatus.INTERVIEW))
                .hiredApplicants(applicantRepository.countByStatus(ApplicantStatus.HIRED))
                .totalVisitors(totalVisitors)
                .newBusinessPlans(newBusinessPlans)
                .businessConversions(businessConversions)
                .totalUsers(totalUsers)
                .systemLogs(systemLogs)
                .businessPlanStatusCounts(bpCounts)
                .applicantStatusCounts(applicantCounts)
                .kpiTrendPercents(trends)
                .visitorLabels(visitorLabels)
                .visitorSeries(visitorSeries)
                .build();
    }

    private long engagementSince(Instant since) {
        return applicantRepository.countByCreatedAtGreaterThanEqual(since)
                + businessPlanRepository.countByCreatedAtGreaterThanEqual(since)
                + contactMessageRepository.countByCreatedAtGreaterThanEqual(since);
    }

    private long engagementBetween(Instant start, Instant end) {
        return applicantsBetween(start, end) + businessPlansBetween(start, end) + contactsBetween(start, end);
    }

    private long applicantsBetween(Instant start, Instant end) {
        return auditSafeCount(applicantRepository.countByCreatedAtGreaterThanEqual(start)
                - applicantRepository.countByCreatedAtGreaterThanEqual(end));
    }

    private long businessPlansBetween(Instant start, Instant end) {
        return auditSafeCount(businessPlanRepository.countByCreatedAtGreaterThanEqual(start)
                - businessPlanRepository.countByCreatedAtGreaterThanEqual(end));
    }

    private long contactsBetween(Instant start, Instant end) {
        return auditSafeCount(contactMessageRepository.countByCreatedAtGreaterThanEqual(start)
                - contactMessageRepository.countByCreatedAtGreaterThanEqual(end));
    }

    private long usersBetween(Instant start, Instant end) {
        return auditSafeCount(userRepository.countByCreatedAtGreaterThanEqual(start)
                - userRepository.countByCreatedAtGreaterThanEqual(end));
    }

    private long auditLogsBetween(Instant start, Instant end) {
        return auditSafeCount(auditLogRepository.countByCreatedAtGreaterThanEqual(start)
                - auditLogRepository.countByCreatedAtGreaterThanEqual(end));
    }

    private long auditSafeCount(long value) {
        return Math.max(value, 0);
    }

    private int trend(long current, long previous) {
        if (previous == 0) {
            return current > 0 ? 100 : 0;
        }
        return Math.round(((current - previous) * 100f) / previous);
    }
}
