package com.cryptowallet.security;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * JPA converter that transparently encrypts a String column at rest with AES-256-GCM.
 *
 * Hibernate instantiates this with a no-arg constructor, so the {@link CryptoService}
 * is injected via a static bridge (see {@link CryptoServiceBridge}) populated at boot.
 *
 * autoApply=false: must be opted in per-field with @Convert(converter = ...).
 */
@Converter(autoApply = false)
public class EncryptedStringConverter implements AttributeConverter<String, String> {

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null) return null;
        return CryptoServiceBridge.required().encrypt(attribute);
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;
        return CryptoServiceBridge.required().decrypt(dbData);
    }
}
