package com.iman.investment.config;

import com.iman.investment.service.JobPublishingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class JobPublishingScheduler {

    private final JobPublishingService jobPublishingService;

    @EventListener(ApplicationReadyEvent.class)
    public void publishOnStartup() {
        int published = jobPublishingService.publishDueJobs(false);
        if (published > 0) {
            log.info("Startup job publisher released {} scheduled role(s)", published);
        }
    }

    /** Hourly check; actual release is gated by admin-configured hour / daily quota. */
    @Scheduled(cron = "${iman.jobs.publish-cron:0 0 * * * *}", zone = "${iman.jobs.publish-zone:Asia/Hong_Kong}")
    public void publishDaily() {
        int published = jobPublishingService.publishDueJobs(false);
        if (published > 0) {
            log.info("Scheduled job publisher released {} role(s)", published);
        }
    }
}
