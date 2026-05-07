package com.cryptowallet.service;

import com.cryptowallet.entity.Wallet;
import com.cryptowallet.repository.UserRepository;
import com.cryptowallet.repository.WalletRepository;
import com.cryptowallet.service.crypto.CryptoProvider;
import com.cryptowallet.service.crypto.CryptoProviderRegistry;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WalletServiceProviderDispatchTest {

    @Mock
    private WalletRepository walletRepository;

    @Mock
    private UserRepository userRepository;

    @Mock(name = "bitcoin")
    private CryptoProvider bitcoinProvider;

    @Mock(name = "tron")
    private CryptoProvider tronProvider;

    @Test
    void refreshBalanceDispatchesToProviderMatchingWalletCurrency() {
        when(bitcoinProvider.supportedCurrency()).thenReturn(Wallet.CryptoCurrency.BITCOIN);
        when(tronProvider.supportedCurrency()).thenReturn(Wallet.CryptoCurrency.USDT_TRC20);
        CryptoProviderRegistry registry = new CryptoProviderRegistry(List.of(bitcoinProvider, tronProvider));

        WalletService walletService = new WalletService(walletRepository, userRepository, registry);

        Wallet wallet = Wallet.builder()
                .id(7L)
                .address("bc1qexample")
                .currency(Wallet.CryptoCurrency.BITCOIN)
                .balance(BigDecimal.ZERO)
                .build();
        when(walletRepository.findById(7L)).thenReturn(Optional.of(wallet));
        when(bitcoinProvider.getBalance("bc1qexample")).thenReturn(new BigDecimal("0.42"));

        walletService.refreshWalletBalance(7L);

        verify(bitcoinProvider, times(1)).getBalance("bc1qexample");
        verify(tronProvider, never()).getBalance(any());
    }
}
