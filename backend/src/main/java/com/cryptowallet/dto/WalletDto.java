package com.cryptowallet.dto;

import com.cryptowallet.entity.Wallet;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class WalletDto {
    private Long id;
    private String address;
    private Wallet.CryptoCurrency currency;
    private BigDecimal balance;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}