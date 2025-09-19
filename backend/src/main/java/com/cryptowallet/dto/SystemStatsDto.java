package com.cryptowallet.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class SystemStatsDto {
    private Long totalUsers;
    private Long activeUsers;
    private Long totalWallets;
    private Long bitcoinWallets;
    private Long usdtWallets;
    private Long totalTransactions;
    private Long pendingTransactions;
    private Long confirmedTransactions;
    private Long failedTransactions;
    private BigDecimal totalBitcoinVolume;
    private BigDecimal totalUsdtVolume;
    private Long usersRegisteredToday;
    private Long transactionsToday;
    private LocalDateTime lastUpdated;
}