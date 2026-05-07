package com.cryptowallet.service.crypto;

import com.cryptowallet.entity.Wallet;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class CryptoProviderRegistryTest {

    @Test
    void resolvesProviderForEachSupportedCurrency() {
        CryptoProvider bitcoin = mock(CryptoProvider.class);
        when(bitcoin.supportedCurrency()).thenReturn(Wallet.CryptoCurrency.BITCOIN);
        CryptoProvider tron = mock(CryptoProvider.class);
        when(tron.supportedCurrency()).thenReturn(Wallet.CryptoCurrency.USDT_TRC20);

        CryptoProviderRegistry registry = new CryptoProviderRegistry(List.of(bitcoin, tron));

        assertThat(registry.get(Wallet.CryptoCurrency.BITCOIN)).isSameAs(bitcoin);
        assertThat(registry.get(Wallet.CryptoCurrency.USDT_TRC20)).isSameAs(tron);
    }

    @Test
    void rejectsDuplicateProvidersForSameCurrency() {
        CryptoProvider first = mock(CryptoProvider.class);
        when(first.supportedCurrency()).thenReturn(Wallet.CryptoCurrency.BITCOIN);
        CryptoProvider second = mock(CryptoProvider.class);
        when(second.supportedCurrency()).thenReturn(Wallet.CryptoCurrency.BITCOIN);

        assertThatThrownBy(() -> new CryptoProviderRegistry(List.of(first, second)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Duplicate")
                .hasMessageContaining("BITCOIN");
    }

    @Test
    void rejectsMissingProviderForAnyCurrency() {
        CryptoProvider onlyBitcoin = mock(CryptoProvider.class);
        when(onlyBitcoin.supportedCurrency()).thenReturn(Wallet.CryptoCurrency.BITCOIN);

        assertThatThrownBy(() -> new CryptoProviderRegistry(List.of(onlyBitcoin)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("No CryptoProvider")
                .hasMessageContaining("USDT_TRC20");
    }
}
