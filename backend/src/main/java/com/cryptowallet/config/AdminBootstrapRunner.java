package com.cryptowallet.config;

import com.cryptowallet.entity.User;
import com.cryptowallet.repository.UserRepository;
import com.cryptowallet.security.CryptoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * First-boot bootstrap of the initial administrator account.
 *
 * <p>Runs once per fresh database. If no user with role=ADMIN exists yet, this runner
 * creates one using the credentials supplied via env vars
 * ({@code ADMIN_BOOTSTRAP_USERNAME}, {@code ADMIN_BOOTSTRAP_EMAIL},
 * {@code ADMIN_BOOTSTRAP_PASSWORD}). When an admin already exists, this runner is a
 * no-op — it never resets passwords or creates duplicates.
 *
 * <p>If the password env var is empty (typical on a hardened production deploy where the
 * operator wants to bootstrap manually), the runner logs a warning and skips. This way
 * staging/CI keep a self-serve flow while prod stays explicit.
 *
 * <p>Runs on {@link ApplicationReadyEvent} so it fires after JPA, Flyway and any
 * {@link DataMigrationRunner} side effects have completed.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AdminBootstrapRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CryptoService cryptoService;

    @Value("${admin.bootstrap.username:admin}")
    private String bootstrapUsername;

    @Value("${admin.bootstrap.email:admin@cryptowallet.local}")
    private String bootstrapEmail;

    @Value("${admin.bootstrap.password:}")
    private String bootstrapPassword;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void bootstrapAdminIfMissing() {
        if (userRepository.existsByRole(User.Role.ADMIN)) {
            log.info("AdminBootstrapRunner: an ADMIN user already exists — skipping bootstrap.");
            return;
        }

        if (bootstrapPassword == null || bootstrapPassword.isBlank()) {
            log.warn("AdminBootstrapRunner: no ADMIN user found AND ADMIN_BOOTSTRAP_PASSWORD is unset — "
                    + "the application has no administrator. Set ADMIN_BOOTSTRAP_PASSWORD (and optionally "
                    + "ADMIN_BOOTSTRAP_USERNAME / ADMIN_BOOTSTRAP_EMAIL) to provision one on next startup.");
            return;
        }

        if (userRepository.existsByUsername(bootstrapUsername)
                || userRepository.existsByEmail(bootstrapEmail)) {
            log.warn("AdminBootstrapRunner: a non-admin user with username={} or email={} already exists — "
                    + "refusing to bootstrap to avoid clobbering. Promote them manually or pick different "
                    + "ADMIN_BOOTSTRAP_USERNAME / ADMIN_BOOTSTRAP_EMAIL.", bootstrapUsername, bootstrapEmail);
            return;
        }

        byte[] dek = cryptoService.generateDek();
        String wrappedDek = cryptoService.wrapDek(dek);
        java.util.Arrays.fill(dek, (byte) 0);

        User admin = User.builder()
                .username(bootstrapUsername)
                .email(bootstrapEmail)
                .password(passwordEncoder.encode(bootstrapPassword))
                .firstName("Admin")
                .lastName("User")
                .role(User.Role.ADMIN)
                .active(true)
                .wrappedDek(wrappedDek)
                .build();

        userRepository.save(admin);
        log.info("AdminBootstrapRunner: bootstrapped initial ADMIN user username={} email={}",
                bootstrapUsername, bootstrapEmail);
    }
}
