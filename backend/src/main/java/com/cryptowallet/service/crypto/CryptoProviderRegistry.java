package com.cryptowallet.service.crypto;

import com.cryptowallet.entity.Wallet;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Component
public class CryptoProviderRegistry {

    private final Map<Wallet.CryptoCurrency, CryptoProvider> providersByCurrency;

    public CryptoProviderRegistry(List<CryptoProvider> providers) {
        EnumMap<Wallet.CryptoCurrency, CryptoProvider> map = new EnumMap<>(Wallet.CryptoCurrency.class);
        for (CryptoProvider provider : providers) {
            Wallet.CryptoCurrency currency = provider.supportedCurrency();
            CryptoProvider existing = map.putIfAbsent(currency, provider);
            if (existing != null) {
                throw new IllegalStateException(
                        "Duplicate CryptoProvider registered for " + currency
                                + ": " + existing.getClass().getName()
                                + " and " + provider.getClass().getName());
            }
        }
        for (Wallet.CryptoCurrency currency : Wallet.CryptoCurrency.values()) {
            if (!map.containsKey(currency)) {
                throw new IllegalStateException("No CryptoProvider registered for " + currency);
            }
        }
        this.providersByCurrency = map;
    }

    public CryptoProvider get(Wallet.CryptoCurrency currency) {
        CryptoProvider provider = providersByCurrency.get(currency);
        if (provider == null) {
            throw new IllegalArgumentException("No CryptoProvider registered for " + currency);
        }
        return provider;
    }
}
