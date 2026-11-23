package com.leadflowai.leadflow.security;

import com.leadflowai.leadflow.user.User;
import com.leadflowai.leadflow.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@Profile("dev")
@Order(1)
@RequiredArgsConstructor
public class DemoUserInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoUserInitializer.class);
    public static final String DEMO_EMAIL = "demo@leadflow.ai";
    public static final String DEMO_PASSWORD = "DemoPass123!";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        if (userRepository.findByEmailIgnoreCase(DEMO_EMAIL).isPresent()) {
            return;
        }
        userRepository.save(User.builder()
                .id(UUID.randomUUID())
                .email(DEMO_EMAIL)
                .passwordHash(passwordEncoder.encode(DEMO_PASSWORD))
                .fullName("LeadFlow Demo User")
                .role("USER")
                .build());
        log.info("Development demo user created: {}", DEMO_EMAIL);
    }
}
