package com.cryptowallet.service;

import com.cryptowallet.dto.WalletCreationDto;
import com.cryptowallet.dto.WalletDto;
import com.cryptowallet.entity.User;
import com.cryptowallet.entity.Wallet;
import com.cryptowallet.repository.UserRepository;
import com.cryptowallet.repository.WalletRepository;
import com.cryptowallet.service.crypto.CryptoProviderRegistry;
import com.cryptowallet.service.crypto.KeyPair;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class WalletService {
    
    private final WalletRepository walletRepository;
    private final UserRepository userRepository;
    private final CryptoProviderRegistry providers;

    public WalletDto createWallet(Long userId, WalletCreationDto creationDto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        KeyPair keyPair = providers.get(creationDto.getCurrency()).generateAddress();

        Wallet wallet = Wallet.builder()
                .address(keyPair.getAddress())
                .privateKey(keyPair.getPrivateKey())
                .currency(creationDto.getCurrency())
                .balance(BigDecimal.ZERO)
                .user(user)
                .active(true)
                .build();
        
        Wallet savedWallet = walletRepository.save(wallet);
        log.info("Wallet created successfully: {} for user: {}", savedWallet.getAddress(), user.getUsername());
        
        return convertToDto(savedWallet);
    }
    
    @Transactional(readOnly = true)
    public List<WalletDto> getUserWallets(Long userId) {
        return walletRepository.findByUserId(userId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public Optional<WalletDto> getWalletById(Long walletId) {
        return walletRepository.findById(walletId)
                .map(this::convertToDto);
    }
    
    @Transactional(readOnly = true)
    public Optional<WalletDto> getWalletByAddress(String address) {
        return walletRepository.findByAddress(address)
                .map(this::convertToDto);
    }
    
    public WalletDto updateWalletBalance(Long walletId, BigDecimal newBalance) {
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));
        
        wallet.setBalance(newBalance);
        Wallet updatedWallet = walletRepository.save(wallet);
        
        log.info("Wallet balance updated: {} - New balance: {}", 
                updatedWallet.getAddress(), newBalance);
        
        return convertToDto(updatedWallet);
    }
    
    public void refreshWalletBalance(Long walletId) {
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));
        
        BigDecimal balance = providers.get(wallet.getCurrency()).getBalance(wallet.getAddress());
        
        wallet.setBalance(balance);
        walletRepository.save(wallet);
        
        log.info("Wallet balance refreshed: {} - Balance: {}", wallet.getAddress(), balance);
    }
    
    public void deactivateWallet(Long walletId) {
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));
        
        wallet.setActive(false);
        walletRepository.save(wallet);
        
        log.info("Wallet deactivated: {}", wallet.getAddress());
    }
    
    public Page<WalletDto> getAllWalletsPaged(Pageable pageable) {
        Page<Wallet> wallets = walletRepository.findAll(pageable);
        return wallets.map(this::convertToDto);
    }
    
    private WalletDto convertToDto(Wallet wallet) {
        WalletDto dto = new WalletDto();
        dto.setId(wallet.getId());
        dto.setAddress(wallet.getAddress());
        dto.setCurrency(wallet.getCurrency());
        dto.setBalance(wallet.getBalance());
        dto.setActive(wallet.getActive());
        dto.setCreatedAt(wallet.getCreatedAt());
        dto.setUpdatedAt(wallet.getUpdatedAt());
        return dto;
    }
}