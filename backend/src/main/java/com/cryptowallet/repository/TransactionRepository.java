package com.cryptowallet.repository;

import com.cryptowallet.entity.Transaction;
import com.cryptowallet.entity.Wallet;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByWalletId(Long walletId);
    List<Transaction> findByWalletIdOrderByCreatedAtDesc(Long walletId);
    Optional<Transaction> findByTxHash(String txHash);
    
    @Query("SELECT t FROM Transaction t WHERE t.wallet.user.id = :userId ORDER BY t.createdAt DESC")
    List<Transaction> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);
    
    List<Transaction> findByStatus(Transaction.TransactionStatus status);
    
    // Admin panel queries
    long countByStatus(Transaction.TransactionStatus status);
    long countByCreatedAtAfter(LocalDateTime date);
    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    
    Page<Transaction> findAll(Pageable pageable);
    Page<Transaction> findByStatus(Transaction.TransactionStatus status, Pageable pageable);
    Page<Transaction> findByType(Transaction.TransactionType type, Pageable pageable);
    
    @Query("SELECT t FROM Transaction t WHERE " +
           "LOWER(t.txHash) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(t.fromAddress) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(t.toAddress) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Transaction> searchTransactions(@Param("search") String search, Pageable pageable);
    
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.wallet.currency = :currency AND t.status = :status")
    BigDecimal sumAmountByWalletCurrencyAndStatus(@Param("currency") Wallet.CryptoCurrency currency, 
                                                  @Param("status") Transaction.TransactionStatus status);
    
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE " +
           "t.createdAt BETWEEN :start AND :end AND t.wallet.currency = :currency AND t.status = :status")
    BigDecimal sumAmountByCreatedAtBetweenAndWalletCurrencyAndStatus(@Param("start") LocalDateTime start,
                                                                     @Param("end") LocalDateTime end,
                                                                     @Param("currency") Wallet.CryptoCurrency currency,
                                                                     @Param("status") Transaction.TransactionStatus status);
}