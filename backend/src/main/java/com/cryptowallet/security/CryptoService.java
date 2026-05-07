package com.cryptowallet.security;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;
import java.util.Set;

/**
 * AES-256-GCM crypto primitives + KEK→DEK key chain.
 *
 * The KEK comes from CRYPTOWALL_KEK_BASE64 (32 raw bytes, base64-encoded).
 * In staging/h2 profiles a deterministic dev fallback is used so the JAR boots
 * unattended — a loud WARN is logged. In prod the missing env var is fatal.
 *
 * Per-record payload format: base64url( IV(12) || ciphertext || tag(16) ).
 * Per-call IV via SecureRandom — never reused for a given key.
 */
@Component
@Slf4j
public class CryptoService {

    private static final String CIPHER_TRANSFORM = "AES/GCM/NoPadding";
    private static final String KEY_ALGO = "AES";
    private static final int IV_LEN = 12;
    private static final int TAG_BITS = 128;
    private static final int DEK_BYTES = 32;
    private static final Set<String> PROD_PROFILES = Set.of("prod", "production");

    private final SecureRandom secureRandom = new SecureRandom();
    private final Environment environment;
    private final String configuredKekBase64;

    private SecretKey kek;
    private SecretKey appDek;

    public CryptoService(Environment environment,
                         @Value("${app.security.kek:}") String configuredKekBase64) {
        this.environment = environment;
        this.configuredKekBase64 = configuredKekBase64;
    }

    @PostConstruct
    void init() {
        byte[] kekBytes = resolveKekBytes();
        this.kek = new SecretKeySpec(kekBytes, KEY_ALGO);
        // Deterministic per-deployment app-DEK derived from KEK (SHA-256 domain-separated).
        // Used by the JPA converter where row-level user context isn't available at fetch time.
        this.appDek = new SecretKeySpec(deriveAppDek(kekBytes), KEY_ALGO);
        Arrays.fill(kekBytes, (byte) 0);
    }

    /** Generate a fresh 256-bit DEK (caller is responsible for wrapping/storage). */
    public byte[] generateDek() {
        byte[] dek = new byte[DEK_BYTES];
        secureRandom.nextBytes(dek);
        return dek;
    }

    /** Wrap a per-user DEK with the master KEK. Returns base64url payload. */
    public String wrapDek(byte[] dek) {
        if (dek == null || dek.length != DEK_BYTES) {
            throw new IllegalArgumentException("DEK must be " + DEK_BYTES + " bytes");
        }
        return encryptWith(kek, dek, null);
    }

    /** Unwrap a stored wrapped-DEK using the master KEK. */
    public byte[] unwrapDek(String wrappedBase64) {
        return decryptWithRaw(kek, wrappedBase64, null);
    }

    /** App-level encrypt — used by the JPA converter. */
    public String encrypt(String plaintext) {
        if (plaintext == null) return null;
        return encryptWith(appDek, plaintext.getBytes(StandardCharsets.UTF_8), null);
    }

    /** App-level decrypt — used by the JPA converter. */
    public String decrypt(String payload) {
        if (payload == null) return null;
        return new String(decryptWithRaw(appDek, payload, null), StandardCharsets.UTF_8);
    }

    /** Per-user encrypt with a previously-unwrapped DEK. AAD optional. */
    public String encryptWithDek(byte[] dek, String plaintext, byte[] aad) {
        SecretKey k = new SecretKeySpec(dek, KEY_ALGO);
        return encryptWith(k, plaintext.getBytes(StandardCharsets.UTF_8), aad);
    }

    /** Per-user decrypt with a previously-unwrapped DEK. AAD optional but must match. */
    public String decryptWithDek(byte[] dek, String payload, byte[] aad) {
        SecretKey k = new SecretKeySpec(dek, KEY_ALGO);
        return new String(decryptWithRaw(k, payload, aad), StandardCharsets.UTF_8);
    }

    private String encryptWith(SecretKey key, byte[] plaintext, byte[] aad) {
        try {
            byte[] iv = new byte[IV_LEN];
            secureRandom.nextBytes(iv);
            Cipher cipher = Cipher.getInstance(CIPHER_TRANSFORM);
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, iv));
            if (aad != null) cipher.updateAAD(aad);
            byte[] ctAndTag = cipher.doFinal(plaintext);
            byte[] out = new byte[IV_LEN + ctAndTag.length];
            System.arraycopy(iv, 0, out, 0, IV_LEN);
            System.arraycopy(ctAndTag, 0, out, IV_LEN, ctAndTag.length);
            return Base64.getUrlEncoder().withoutPadding().encodeToString(out);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("AES-GCM encrypt failed", e);
        }
    }

    private byte[] decryptWithRaw(SecretKey key, String payload, byte[] aad) {
        try {
            byte[] in = Base64.getUrlDecoder().decode(payload);
            if (in.length < IV_LEN + 16) {
                throw new IllegalArgumentException("payload too short");
            }
            byte[] iv = Arrays.copyOfRange(in, 0, IV_LEN);
            byte[] ctAndTag = Arrays.copyOfRange(in, IV_LEN, in.length);
            Cipher cipher = Cipher.getInstance(CIPHER_TRANSFORM);
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, iv));
            if (aad != null) cipher.updateAAD(aad);
            return cipher.doFinal(ctAndTag);
        } catch (GeneralSecurityException e) {
            // Wrap as runtime so AEADBadTagException propagates as a clear failure.
            throw new IllegalStateException("AES-GCM decrypt failed: " + e.getClass().getSimpleName(), e);
        }
    }

    private byte[] resolveKekBytes() {
        String env = System.getenv("CRYPTOWALL_KEK_BASE64");
        String configured = (env != null && !env.isBlank()) ? env : configuredKekBase64;
        if (configured != null && !configured.isBlank()) {
            byte[] decoded = Base64.getDecoder().decode(configured.trim());
            if (decoded.length != DEK_BYTES) {
                throw new IllegalStateException(
                    "CRYPTOWALL_KEK_BASE64 must decode to " + DEK_BYTES + " bytes, got " + decoded.length);
            }
            return decoded;
        }
        if (isProdProfile()) {
            throw new IllegalStateException(
                "CRYPTOWALL_KEK_BASE64 (or app.security.kek) is required in prod profile");
        }
        log.warn("CRYPTOWALL_KEK_BASE64 not set — using DETERMINISTIC DEV KEK. " +
                 "Encrypted-at-rest secrets WILL NOT survive a KEK rotation. " +
                 "Set the env var before any non-staging use.");
        return devFallbackKek();
    }

    private boolean isProdProfile() {
        for (String p : environment.getActiveProfiles()) {
            if (PROD_PROFILES.contains(p)) return true;
        }
        return false;
    }

    private static byte[] deriveAppDek(byte[] kekBytes) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            md.update("cryptowallet:app-dek:v1".getBytes(StandardCharsets.UTF_8));
            md.update(kekBytes);
            return md.digest();
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }

    private static byte[] devFallbackKek() {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return md.digest("cryptowallet-dev-kek-do-not-use-in-prod".getBytes(StandardCharsets.UTF_8));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}
