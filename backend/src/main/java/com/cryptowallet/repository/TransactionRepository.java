package com.cryptowallet.repository;

import com.cryptowallet.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

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
}