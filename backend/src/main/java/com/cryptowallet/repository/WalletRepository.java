package com.cryptowallet.repository;

import com.cryptowallet.entity.Wallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WalletRepository extends JpaRepository<Wallet, Long> {
    List<Wallet> findByUserId(Long userId);
    List<Wallet> findByUserIdAndCurrency(Long userId, Wallet.CryptoCurrency currency);
    Optional<Wallet> findByAddress(String address);
    List<Wallet> findByActiveTrue();
}