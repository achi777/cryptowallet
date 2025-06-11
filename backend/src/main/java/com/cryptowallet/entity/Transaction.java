package com.cryptowallet.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Transaction {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "tx_hash", unique = true, nullable = false)
    private String txHash;
    
    @Column(name = "from_address", nullable = false)
    private String fromAddress;
    
    @Column(name = "to_address", nullable = false)
    private String toAddress;
    
    @Column(precision = 20, scale = 8, nullable = false)
    private BigDecimal amount;
    
    @Column(precision = 20, scale = 8)
    private BigDecimal fee;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType type;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionStatus status;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wallet_id", nullable = false)
    private Wallet wallet;
    
    @Column(name = "block_number")
    private Long blockNumber;
    
    @Column(name = "confirmations")
    private Integer confirmations;
    
    private String memo;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    public enum TransactionType {
        SEND, RECEIVE
    }
    
    public enum TransactionStatus {
        PENDING, CONFIRMED, FAILED
    }
}