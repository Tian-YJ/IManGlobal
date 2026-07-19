package com.iman.investment.service;

import com.iman.investment.entity.Job;
import com.iman.investment.entity.Setting;
import com.iman.investment.enums.JobStatus;
import com.iman.investment.exception.BadRequestException;
import com.iman.investment.repository.JobRepository;
import com.iman.investment.repository.SettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class JobPublishingService {

    public static final String KEY_ENABLED = "jobs.publish_enabled";
    public static final String KEY_PER_DAY = "jobs.publish_per_day";
    public static final String KEY_MAX_OPEN = "jobs.max_open";
    public static final String KEY_AUTO_ROTATE = "jobs.auto_rotate";
    public static final String KEY_ZONE = "jobs.publish_zone";
    public static final String KEY_HOUR = "jobs.publish_hour";
    public static final String KEY_LAST_PUBLISH = "jobs.last_publish_date";

    private final JobRepository jobRepository;
    private final SettingRepository settingRepository;

    @Value("${iman.jobs.publish-per-day:2}")
    private int defaultPublishPerDay;

    @Value("${iman.jobs.max-open:6}")
    private int defaultMaxOpen;

    @Value("${iman.jobs.auto-rotate:true}")
    private boolean defaultAutoRotate;

    @Value("${iman.jobs.publish-zone:Asia/Hong_Kong}")
    private String defaultPublishZone;

    @Value("${iman.jobs.publish-hour:9}")
    private int defaultPublishHour;

    @Value("${iman.jobs.publish-enabled:true}")
    private boolean defaultEnabled;

    public record PublishConfig(
            boolean enabled,
            int publishPerDay,
            int maxOpen,
            boolean autoRotate,
            String publishZone,
            int publishHour,
            String lastPublishDate
    ) {}

    public PublishConfig loadConfig() {
        return new PublishConfig(
                boolSetting(KEY_ENABLED, defaultEnabled),
                intSetting(KEY_PER_DAY, defaultPublishPerDay, 0, 20),
                intSetting(KEY_MAX_OPEN, defaultMaxOpen, 1, 50),
                boolSetting(KEY_AUTO_ROTATE, defaultAutoRotate),
                stringSetting(KEY_ZONE, defaultPublishZone),
                intSetting(KEY_HOUR, defaultPublishHour, 0, 23),
                stringSetting(KEY_LAST_PUBLISH, "")
        );
    }

    @Transactional
    public PublishConfig saveConfig(boolean enabled, int publishPerDay, int maxOpen, boolean autoRotate,
                                    String publishZone, int publishHour, String email) {
        if (publishPerDay < 0 || publishPerDay > 20) throw new BadRequestException("publishPerDay must be between 0 and 20");
        if (maxOpen < 1 || maxOpen > 50) throw new BadRequestException("maxOpen must be between 1 and 50");
        if (publishHour < 0 || publishHour > 23) throw new BadRequestException("publishHour must be between 0 and 23");
        String zone = (publishZone == null || publishZone.isBlank()) ? defaultPublishZone : publishZone.trim();
        try {
            ZoneId.of(zone);
        } catch (Exception ex) {
            throw new BadRequestException("Invalid publishZone: " + zone);
        }

        upsert(KEY_ENABLED, String.valueOf(enabled), "Enable automatic daily job publishing", "careers");
        upsert(KEY_PER_DAY, String.valueOf(publishPerDay), "Maximum roles to auto-publish each day", "careers");
        upsert(KEY_MAX_OPEN, String.valueOf(maxOpen), "Maximum publicly open roles before oldest are closed", "careers");
        upsert(KEY_AUTO_ROTATE, String.valueOf(autoRotate), "Auto-close oldest roles when over max open", "careers");
        upsert(KEY_ZONE, zone, "Timezone used for daily publishing", "careers");
        upsert(KEY_HOUR, String.valueOf(publishHour), "Local hour (0-23) when the daily publisher may run", "careers");
        log.info("Job publishing config updated by {}", email);
        return loadConfig();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> status() {
        PublishConfig config = loadConfig();
        ZoneId zone = ZoneId.of(config.publishZone());
        LocalDate today = LocalDate.now(zone);
        List<Job> upcoming = jobRepository.findByStatusOrderByDatePostedAscIdAsc(
                JobStatus.SCHEDULED, PageRequest.of(0, 12));
        List<Map<String, Object>> queue = new ArrayList<>();
        for (Job job : upcoming) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", job.getId());
            row.put("title", job.getTitle());
            row.put("slug", job.getSlug());
            row.put("datePosted", job.getDatePosted());
            row.put("department", job.getDepartment());
            row.put("location", job.getLocation());
            row.put("due", job.getDatePosted() != null && !job.getDatePosted().isAfter(today));
            queue.add(row);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("config", Map.of(
                "enabled", config.enabled(),
                "publishPerDay", config.publishPerDay(),
                "maxOpen", config.maxOpen(),
                "autoRotate", config.autoRotate(),
                "publishZone", config.publishZone(),
                "publishHour", config.publishHour(),
                "lastPublishDate", config.lastPublishDate() == null ? "" : config.lastPublishDate()
        ));
        result.put("counts", Map.of(
                "published", jobRepository.countByStatus(JobStatus.PUBLISHED),
                "scheduled", jobRepository.countByStatus(JobStatus.SCHEDULED),
                "closed", jobRepository.countByStatus(JobStatus.CLOSED),
                "draft", jobRepository.countByStatus(JobStatus.DRAFT)
        ));
        result.put("today", today.toString());
        result.put("alreadyRanToday", today.toString().equals(config.lastPublishDate()));
        result.put("queue", queue);
        return result;
    }

    @Transactional
    public int publishDueJobs() {
        return publishDueJobs(false);
    }

    @Transactional
    public int publishDueJobs(boolean force) {
        PublishConfig config = loadConfig();
        if (!config.enabled() && !force) {
            log.debug("Job publisher skipped — disabled");
            return 0;
        }

        ZoneId zone = ZoneId.of(config.publishZone());
        LocalDate today = LocalDate.now(zone);
        LocalDateTime now = LocalDateTime.now(zone);

        if (!force) {
            if (today.toString().equals(config.lastPublishDate())) {
                log.debug("Job publisher skipped — already ran on {}", today);
                return 0;
            }
            if (now.getHour() < config.publishHour()) {
                log.debug("Job publisher skipped — before publish hour {}", config.publishHour());
                return 0;
            }
        }

        int limit = Math.max(0, config.publishPerDay());
        if (limit == 0) return 0;

        List<Job> due = jobRepository.findByStatusAndDatePostedLessThanEqualOrderByDatePostedAscIdAsc(
                JobStatus.SCHEDULED, today, PageRequest.of(0, limit));

        for (Job job : due) {
            job.setStatus(JobStatus.PUBLISHED);
            if (job.getDatePosted() == null || job.getDatePosted().isAfter(today)) {
                job.setDatePosted(today);
            }
            jobRepository.save(job);
            log.info("Published scheduled job {} ({})", job.getTitle(), job.getSlug());
        }

        if (!due.isEmpty() || force) {
            upsert(KEY_LAST_PUBLISH, today.toString(), "Last automatic or manual publish date", "careers");
        }

        if (config.autoRotate() && !due.isEmpty()) {
            rotateOverflow(config.maxOpen());
        }
        return due.size();
    }

    private void rotateOverflow(int maxOpen) {
        long open = jobRepository.countByStatus(JobStatus.PUBLISHED);
        if (open <= maxOpen) return;

        int toClose = (int) (open - maxOpen);
        List<Job> oldest = jobRepository.findByStatusOrderByDatePostedAscIdAsc(
                JobStatus.PUBLISHED, PageRequest.of(0, toClose));
        for (Job job : oldest) {
            job.setStatus(JobStatus.CLOSED);
            jobRepository.save(job);
            log.info("Auto-closed job {} to keep open roles at {}", job.getSlug(), maxOpen);
        }
    }

    private void upsert(String key, String value, String description, String category) {
        Setting setting = settingRepository.findByKey(key).orElseGet(Setting::new);
        setting.setKey(key);
        setting.setValue(value);
        setting.setDescription(description);
        setting.setCategory(category);
        settingRepository.save(setting);
    }

    private String stringSetting(String key, String fallback) {
        return settingRepository.findByKey(key).map(Setting::getValue).filter(v -> v != null && !v.isBlank()).orElse(fallback);
    }

    private boolean boolSetting(String key, boolean fallback) {
        return settingRepository.findByKey(key)
                .map(Setting::getValue)
                .map(v -> "true".equalsIgnoreCase(v) || "1".equals(v) || "yes".equalsIgnoreCase(v))
                .orElse(fallback);
    }

    private int intSetting(String key, int fallback, int min, int max) {
        try {
            int value = settingRepository.findByKey(key)
                    .map(Setting::getValue)
                    .filter(v -> v != null && !v.isBlank())
                    .map(Integer::parseInt)
                    .orElse(fallback);
            return Math.max(min, Math.min(max, value));
        } catch (NumberFormatException ex) {
            return fallback;
        }
    }
}
