package com.cryptowallet.dto;

import com.cryptowallet.entity.Wallet;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class WalletCreationDto {
    
    @NotNull(message = "Currency is required")
    private Wallet.CryptoCurrency currency;
}