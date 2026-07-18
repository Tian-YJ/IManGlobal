package com.iman.investment.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class DashboardStatsResponse {
    private long totalBusinessPlans;
    private long reviewingBusinessPlans;
    private long approvedBusinessPlans;
    private long rejectedBusinessPlans;
    private long activePortfolio;
    private long openJobs;
    private long totalApplicants;
    private long newApplicants;
    private long interviewingApplicants;
    private long hiredApplicants;
    private long totalVisitors;
    private long newBusinessPlans;
    private long businessConversions;
    private long totalUsers;
    private long systemLogs;
    private Map<String, Long> businessPlanStatusCounts;
    private Map<String, Long> applicantStatusCounts;
    private Map<String, Integer> kpiTrendPercents;
    private List<String> visitorLabels;
    private List<Long> visitorSeries;
}
