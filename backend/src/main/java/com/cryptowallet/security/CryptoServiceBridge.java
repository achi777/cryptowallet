package com.cryptowallet.security;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

/**
 * Bridges the Spring-managed {@link CryptoService} into objects Hibernate
 * instantiates by reflection (e.g. {@link EncryptedStringConverter}).
 */
@Component
public class CryptoServiceBridge {

    private static volatile CryptoService instance;

    private final CryptoService cryptoService;

    public CryptoServiceBridge(CryptoService cryptoService) {
        this.cryptoService = cryptoService;
    }

    @PostConstruct
    void publish() {
        instance = cryptoService;
    }

    static CryptoService required() {
        CryptoService s = instance;
        if (s == null) {
            throw new IllegalStateException(
                "CryptoService not yet initialised — converter invoked before Spring context boot");
        }
        return s;
    }
}
