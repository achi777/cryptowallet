package com.cryptowallet.repository;

import com.cryptowallet.entity.Wallet;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface WalletRepository extends JpaRepository<Wallet, Long> {
    List<Wallet> findByUserId(Long userId);
    List<Wallet> findByUserIdAndCurrency(Long userId, Wallet.CryptoCurrency currency);
    Optional<Wallet> findByAddress(String address);
    List<Wallet> findByActiveTrue();
    
    // Admin panel queries
    long countByCurrency(Wallet.CryptoCurrency currency);
    long countByActiveTrue();
    long countByCreatedAtAfter(LocalDateTime date);
    
    Page<Wallet> findAll(Pageable pageable);
    Page<Wallet> findByCurrency(Wallet.CryptoCurrency currency, Pageable pageable);
    Page<Wallet> findByActiveTrue(Pageable pageable);
    
    @Query("SELECT w FROM Wallet w JOIN w.user u WHERE " +
           "LOWER(w.address) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Wallet> searchWallets(@Param("search") String search, Pageable pageable);
}