package com.iman.investment.service;

import com.iman.investment.entity.AuditLog;
import com.iman.investment.entity.User;
import com.iman.investment.enums.AuditAction;
import com.iman.investment.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public void log(User user, AuditAction action, String module, String entityType, String entityId, String details) {
        AuditLog log = AuditLog.builder()
                .user(user)
                .action(action)
                .module(module)
                .entityType(entityType)
                .entityId(entityId)
                .details(details)
                .build();
        auditLogRepository.save(log);
    }
}
