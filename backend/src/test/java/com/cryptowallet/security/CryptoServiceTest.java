package com.cryptowallet.security;

import org.junit.jupiter.api.Test;
import org.springframework.core.env.StandardEnvironment;

import java.util.Base64;
import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CryptoServiceTest {

    private static CryptoService newService() {
        // Fixed 32-byte KEK for deterministic tests.
        byte[] kek = new byte[32];
        for (int i = 0; i < 32; i++) kek[i] = (byte) i;
        String b64 = Base64.getEncoder().encodeToString(kek);
        CryptoService svc = new CryptoService(new StandardEnvironment(), b64);
        svc.init();
        return svc;
    }

    @Test
    void roundTripEncryptDecrypt() {
        CryptoService svc = newService();
        String pt = "wallet-private-key-Kz9aB3cD4eF5gH6iJ7kL8mN9oPqRs";
        String enc = svc.encrypt(pt);
        assertThat(enc).isNotEqualTo(pt);
        assertThat(svc.decrypt(enc)).isEqualTo(pt);
    }

    @Test
    void ivIsUniqueAcrossCalls() {
        CryptoService svc = newService();
        Set<String> seen = new HashSet<>();
        for (int i = 0; i < 50; i++) {
            seen.add(svc.encrypt("same-plaintext"));
        }
        // Different IVs => different ciphertexts each call.
        assertThat(seen).hasSize(50);
    }

    @Test
    void tamperedPayloadFailsAuthentication() {
        CryptoService svc = newService();
        String enc = svc.encrypt("sensitive");
        byte[] raw = Base64.getUrlDecoder().decode(enc);
        // Flip a bit in the auth tag (last byte).
        raw[raw.length - 1] ^= 0x01;
        String tampered = Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
        assertThatThrownBy(() -> svc.decrypt(tampered))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("AES-GCM decrypt failed");
    }

    @Test
    void perUserDekRoundTrip() {
        CryptoService svc = newService();
        byte[] dek = svc.generateDek();
        assertThat(dek).hasSize(32);
        String wrapped = svc.wrapDek(dek);
        byte[] unwrapped = svc.unwrapDek(wrapped);
        assertThat(unwrapped).isEqualTo(dek);

        String enc = svc.encryptWithDek(unwrapped, "mnemonic words here", null);
        assertThat(svc.decryptWithDek(unwrapped, enc, null)).isEqualTo("mnemonic words here");
    }

    @Test
    void aadMismatchFails() {
        CryptoService svc = newService();
        byte[] dek = svc.generateDek();
        String enc = svc.encryptWithDek(dek, "secret", "user:42".getBytes());
        assertThatThrownBy(() -> svc.decryptWithDek(dek, enc, "user:99".getBytes()))
            .isInstanceOf(IllegalStateException.class);
    }
}
