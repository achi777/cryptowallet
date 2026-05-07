package com.cryptowallet.entity;

import com.cryptowallet.security.EncryptedStringConverter;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "wallets")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Wallet {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String address;
    
    /**
     * Wallet signing key — encrypted-at-rest via {@link EncryptedStringConverter}
     * (AES-256-GCM, app-DEK derived from the KEK). Column widened to hold the
     * base64url IV||ciphertext||tag payload. See SECURITY.md.
     */
    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "private_key", nullable = false, length = 1024)
    private String privateKey;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CryptoCurrency currency;
    
    @Column(precision = 20, scale = 8)
    private BigDecimal balance = BigDecimal.ZERO;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @OneToMany(mappedBy = "wallet", cascade = CascadeType.ALL)
    private List<Transaction> transactions = new ArrayList<>();
    
    private Boolean active = true;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public enum CryptoCurrency {
        BITCOIN("BTC"),
        USDT_TRC20("USDT");
        
        private final String symbol;
        
        CryptoCurrency(String symbol) {
            this.symbol = symbol;
        }
        
        public String getSymbol() {
            return symbol;
        }
    }
}