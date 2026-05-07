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
 * First-boot bootstrap of a seeded customer (regular USER) account.
 *
 * <p>Mirrors {@link AdminBootstrapRunner} for the customer side: when the password env var
 * is set and no user with the configured username/email exists, this runner provisions a
 * single {@code role=USER} account so the portal validator's {@code auth-walk-as-customer}
 * scenario has something to sign in as. Subsequent restarts are a no-op.
 *
 * <p>If the password env var is empty (production-style hardened deploys) the runner logs
 * a warning and skips — no implicit customer is ever created without explicit opt-in.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CustomerBootstrapRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CryptoService cryptoService;

    @Value("${customer.bootstrap.username:customer}")
    private String bootstrapUsername;

    @Value("${customer.bootstrap.email:customer@cryptowall.local}")
    private String bootstrapEmail;

    @Value("${customer.bootstrap.password:}")
    private String bootstrapPassword;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void bootstrapCustomerIfMissing() {
        if (bootstrapPassword == null || bootstrapPassword.isBlank()) {
            log.warn("CustomerBootstrapRunner: CUSTOMER_BOOTSTRAP_PASSWORD is unset — "
                    + "skipping seed customer provisioning. Set CUSTOMER_BOOTSTRAP_PASSWORD "
                    + "(and optionally CUSTOMER_BOOTSTRAP_USERNAME / CUSTOMER_BOOTSTRAP_EMAIL) "
                    + "to provision the seeded customer on next startup.");
            return;
        }

        if (userRepository.existsByUsername(bootstrapUsername)
                || userRepository.existsByEmail(bootstrapEmail)) {
            log.info("CustomerBootstrapRunner: a user with username={} or email={} already exists — "
                    + "skipping bootstrap.", bootstrapUsername, bootstrapEmail);
            return;
        }

        byte[] dek = cryptoService.generateDek();
        String wrappedDek = cryptoService.wrapDek(dek);
        java.util.Arrays.fill(dek, (byte) 0);

        User customer = User.builder()
                .username(bootstrapUsername)
                .email(bootstrapEmail)
                .password(passwordEncoder.encode(bootstrapPassword))
                .firstName("Test")
                .lastName("Customer")
                .role(User.Role.USER)
                .active(true)
                .wrappedDek(wrappedDek)
                .build();

        userRepository.save(customer);
        log.info("CustomerBootstrapRunner: bootstrapped seeded customer username={} email={}",
                bootstrapUsername, bootstrapEmail);
    }
}
