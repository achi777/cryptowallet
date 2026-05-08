package com.cryptowallet.service.crypto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class TransactionResult {
    private String txHash;
    private BigDecimal fee;
}
