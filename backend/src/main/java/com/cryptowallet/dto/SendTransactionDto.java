package com.cryptowallet.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class SendTransactionDto {
    
    @NotNull(message = "Wallet ID is required")
    private Long walletId;
    
    @NotBlank(message = "To address is required")
    private String toAddress;
    
    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.00000001", message = "Amount must be greater than 0")
    private BigDecimal amount;
    
    private String memo;
}