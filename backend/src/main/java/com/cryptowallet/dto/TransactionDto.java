package com.cryptowallet.dto;

import com.cryptowallet.entity.Transaction;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class TransactionDto {
    private Long id;
    private String txHash;
    private String fromAddress;
    private String toAddress;
    private BigDecimal amount;
    private BigDecimal fee;
    private Transaction.TransactionType type;
    private Transaction.TransactionStatus status;
    private Long blockNumber;
    private Integer confirmations;
    private String memo;
    private LocalDateTime createdAt;
}