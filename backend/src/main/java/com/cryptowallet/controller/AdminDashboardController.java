package com.cryptowallet.controller;

import com.cryptowallet.dto.*;
import com.cryptowallet.entity.Transaction;
import com.cryptowallet.entity.Wallet;
import com.cryptowallet.service.AdminStatsService;
import com.cryptowallet.service.TransactionService;
import com.cryptowallet.service.UserService;
import com.cryptowallet.service.WalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:3000")
public class AdminDashboardController {
    
    private final AdminStatsService adminStatsService;
    private final UserService userService;
    private final WalletService walletService;
    private final TransactionService transactionService;
    
    @GetMapping("/stats")
    public ResponseEntity<SystemStatsDto> getSystemStats() {
        SystemStatsDto stats = adminStatsService.getSystemStatistics();
        return ResponseEntity.ok(stats);
    }
    
    // User Management Endpoints
    @GetMapping("/users")
    public ResponseEntity<Page<UserDto>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) Boolean active) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<UserDto> users = userService.getAllUsersPaged(pageable);
        return ResponseEntity.ok(users);
    }
    
    @GetMapping("/users/search")
    public ResponseEntity<Page<UserDto>> searchUsers(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        // Implementation would need to be added to UserService
        return ResponseEntity.ok(Page.empty(pageable));
    }
    
    @PutMapping("/users/{id}/toggle-status")
    public ResponseEntity<UserDto> toggleUserStatus(@PathVariable Long id) {
        try {
            Optional<UserDto> userOpt = userService.findById(id);
            if (userOpt.isPresent()) {
                UserDto user = userOpt.get();
                user.setActive(!user.getActive());
                UserDto updatedUser = userService.updateUser(id, user);
                return ResponseEntity.ok(updatedUser);
            }
            return ResponseEntity.notFound().build();
        } catch (RuntimeException e) {
            log.error("User status toggle failed: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    // Wallet Management Endpoints
    @GetMapping("/wallets")
    public ResponseEntity<Page<WalletDto>> getAllWallets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) Wallet.CryptoCurrency currency,
            @RequestParam(required = false) Boolean active) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<WalletDto> wallets = walletService.getAllWalletsPaged(pageable);
        return ResponseEntity.ok(wallets);
    }
    
    @GetMapping("/wallets/search")
    public ResponseEntity<Page<WalletDto>> searchWallets(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        // Implementation would need to be added to WalletService
        return ResponseEntity.ok(Page.empty(pageable));
    }
    
    @PutMapping("/wallets/{id}/toggle-status")
    public ResponseEntity<Void> toggleWalletStatus(@PathVariable Long id) {
        try {
            Optional<WalletDto> walletOpt = walletService.getWalletById(id);
            if (walletOpt.isPresent()) {
                WalletDto wallet = walletOpt.get();
                if (wallet.getActive()) {
                    walletService.deactivateWallet(id);
                } else {
                    // Would need implementation to reactivate wallet
                }
                return ResponseEntity.ok().build();
            }
            return ResponseEntity.notFound().build();
        } catch (RuntimeException e) {
            log.error("Wallet status toggle failed: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PostMapping("/wallets/{id}/refresh-balance")
    public ResponseEntity<Void> refreshWalletBalance(@PathVariable Long id) {
        try {
            walletService.refreshWalletBalance(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            log.error("Wallet balance refresh failed: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    // Transaction Management Endpoints
    @GetMapping("/transactions")
    public ResponseEntity<Page<TransactionDto>> getAllTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) Transaction.TransactionStatus status,
            @RequestParam(required = false) Transaction.TransactionType type) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<TransactionDto> transactions = transactionService.getAllTransactionsPaged(pageable);
        return ResponseEntity.ok(transactions);
    }
    
    @GetMapping("/transactions/search")
    public ResponseEntity<Page<TransactionDto>> searchTransactions(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        // Implementation would need to be added to TransactionService
        return ResponseEntity.ok(Page.empty(pageable));
    }
    
    @GetMapping("/transactions/pending")
    public ResponseEntity<Page<TransactionDto>> getPendingTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        // Implementation would need to be added to TransactionService
        return ResponseEntity.ok(Page.empty(pageable));
    }
    
    // Analytics Endpoints
    @GetMapping("/analytics/users-registered")
    public ResponseEntity<Long> getUsersRegisteredInPeriod(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        
        Long count = adminStatsService.getUsersRegisteredInPeriod(start, end);
        return ResponseEntity.ok(count);
    }
    
    @GetMapping("/analytics/transactions")
    public ResponseEntity<Long> getTransactionsInPeriod(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        
        Long count = adminStatsService.getTransactionsInPeriod(start, end);
        return ResponseEntity.ok(count);
    }
    
    @GetMapping("/analytics/volume")
    public ResponseEntity<BigDecimal> getVolumeInPeriod(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            @RequestParam Wallet.CryptoCurrency currency) {
        
        BigDecimal volume = adminStatsService.getVolumeInPeriod(start, end, currency);
        return ResponseEntity.ok(volume);
    }
    
    // Utility endpoint for creating sample data
    @PostMapping("/create-sample-data")
    public ResponseEntity<String> createSampleData() {
        transactionService.createSampleTransactions();
        return ResponseEntity.ok("Sample transactions created successfully");
    }
}