package com.cryptowallet.service;

import com.cryptowallet.dto.SystemStatsDto;
import com.cryptowallet.entity.Transaction;
import com.cryptowallet.entity.Wallet;
import com.cryptowallet.repository.TransactionRepository;
import com.cryptowallet.repository.UserRepository;
import com.cryptowallet.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AdminStatsService {
    
    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    
    public SystemStatsDto getSystemStatistics() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        
        return SystemStatsDto.builder()
                .totalUsers(userRepository.count())
                .activeUsers(userRepository.countByActiveTrue())
                .totalWallets(walletRepository.count())
                .bitcoinWallets(walletRepository.countByCurrency(Wallet.CryptoCurrency.BITCOIN))
                .usdtWallets(walletRepository.countByCurrency(Wallet.CryptoCurrency.USDT_TRC20))
                .totalTransactions(transactionRepository.count())
                .pendingTransactions(transactionRepository.countByStatus(Transaction.TransactionStatus.PENDING))
                .confirmedTransactions(transactionRepository.countByStatus(Transaction.TransactionStatus.CONFIRMED))
                .failedTransactions(transactionRepository.countByStatus(Transaction.TransactionStatus.FAILED))
                .totalBitcoinVolume(getTotalVolumeByWalletCurrency(Wallet.CryptoCurrency.BITCOIN))
                .totalUsdtVolume(getTotalVolumeByWalletCurrency(Wallet.CryptoCurrency.USDT_TRC20))
                .usersRegisteredToday(userRepository.countByCreatedAtAfter(startOfDay))
                .transactionsToday(transactionRepository.countByCreatedAtAfter(startOfDay))
                .lastUpdated(LocalDateTime.now())
                .build();
    }
    
    private BigDecimal getTotalVolumeByWalletCurrency(Wallet.CryptoCurrency currency) {
        return transactionRepository.sumAmountByWalletCurrencyAndStatus(
                currency, Transaction.TransactionStatus.CONFIRMED);
    }
    
    public Long getUsersRegisteredInPeriod(LocalDateTime start, LocalDateTime end) {
        return userRepository.countByCreatedAtBetween(start, end);
    }
    
    public Long getTransactionsInPeriod(LocalDateTime start, LocalDateTime end) {
        return transactionRepository.countByCreatedAtBetween(start, end);
    }
    
    public BigDecimal getVolumeInPeriod(LocalDateTime start, LocalDateTime end, Wallet.CryptoCurrency currency) {
        return transactionRepository.sumAmountByCreatedAtBetweenAndWalletCurrencyAndStatus(
                start, end, currency, Transaction.TransactionStatus.CONFIRMED);
    }
}