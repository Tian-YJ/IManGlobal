package com.iman.investment.config;

import com.iman.investment.entity.Role;
import com.iman.investment.entity.User;
import com.iman.investment.repository.RoleRepository;
import com.iman.investment.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminBootstrap implements ApplicationRunner {
    private final UserRepository users;
    private final RoleRepository roles;
    private final PasswordEncoder encoder;

    @Value("${iman.bootstrap-admin.email:admin@imaninvestment.com}")
    private String email;
    @Value("${iman.bootstrap-admin.password:}")
    private String password;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (users.existsByEmail(email)) return;
        if (password == null || password.length() < 12) {
            log.warn("No initial administrator was created. Set ADMIN_INITIAL_PASSWORD to a strong 12+ character value.");
            return;
        }
        Role superAdmin = roles.findByName("SUPER_ADMIN")
                .orElseThrow(() -> new IllegalStateException("Seeded SUPER_ADMIN role is missing"));
        users.save(User.builder().email(email.toLowerCase()).password(encoder.encode(password))
                .firstName("System").lastName("Administrator").active(true)
                .roles(new HashSet<>(java.util.Set.of(superAdmin))).build());
        log.info("Initial administrator account created; rotate its password after first login.");
    }
}
