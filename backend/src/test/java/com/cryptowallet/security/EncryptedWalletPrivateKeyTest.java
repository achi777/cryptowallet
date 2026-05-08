package com.cryptowallet.security;

import com.cryptowallet.entity.User;
import com.cryptowallet.entity.Wallet;
import com.cryptowallet.repository.UserRepository;
import com.cryptowallet.repository.WalletRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * End-to-end check that {@link EncryptedStringConverter} encrypts the
 * Wallet.private_key column on disk but transparently exposes plaintext
 * on the JPA attribute.
 */
@SpringBootTest
@ActiveProfiles("h2")
@Transactional
class EncryptedWalletPrivateKeyTest {

    @Autowired private UserRepository userRepository;
    @Autowired private WalletRepository walletRepository;
    @Autowired private EntityManager entityManager;
    @Autowired private JdbcTemplate jdbcTemplate;

    @Test
    void privateKeyIsEncryptedOnDiskAndDecryptedOnLoad() {
        String plaintextKey = "L1aW4aHbjJh1pP2Lv9qJ8fH3bR7tK5cN6mE0vYwS";

        User user = User.builder()
                .username("crypto-it-" + System.nanoTime())
                .email("it-" + System.nanoTime() + "@example.com")
                .password("bcrypt-placeholder")
                .active(true)
                .build();
        user = userRepository.save(user);

        Wallet wallet = Wallet.builder()
                .address("addr-" + System.nanoTime())
                .privateKey(plaintextKey)
                .currency(Wallet.CryptoCurrency.BITCOIN)
                .balance(BigDecimal.ZERO)
                .user(user)
                .active(true)
                .build();
        wallet = walletRepository.save(wallet);
        Long id = wallet.getId();

        // Force a clean read so the converter runs.
        entityManager.flush();
        entityManager.clear();

        // On-disk column must NOT contain the plaintext.
        String onDisk = jdbcTemplate.queryForObject(
            "select private_key from wallets where id = ?", String.class, id);
        assertThat(onDisk).isNotNull();
        assertThat(onDisk).doesNotContain(plaintextKey);
        assertThat(onDisk.length()).isGreaterThan(plaintextKey.length()); // base64url(IV||ct||tag)

        // Through the converter we get the original plaintext back.
        Wallet reloaded = walletRepository.findById(id).orElseThrow();
        assertThat(reloaded.getPrivateKey()).isEqualTo(plaintextKey);
    }
}
