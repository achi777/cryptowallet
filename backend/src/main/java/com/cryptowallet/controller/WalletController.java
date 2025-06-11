package com.cryptowallet.controller;

import com.cryptowallet.dto.WalletCreationDto;
import com.cryptowallet.dto.WalletDto;
import com.cryptowallet.service.WalletService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wallets")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class WalletController {
    
    private final WalletService walletService;
    
    @PostMapping("/user/{userId}")
    public ResponseEntity<WalletDto> createWallet(@PathVariable Long userId, 
                                                 @Valid @RequestBody WalletCreationDto creationDto) {
        WalletDto wallet = walletService.createWallet(userId, creationDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(wallet);
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<WalletDto>> getUserWallets(@PathVariable Long userId) {
        List<WalletDto> wallets = walletService.getUserWallets(userId);
        return ResponseEntity.ok(wallets);
    }
    
    @GetMapping("/{walletId}")
    public ResponseEntity<WalletDto> getWalletById(@PathVariable Long walletId) {
        return walletService.getWalletById(walletId)
                .map(wallet -> ResponseEntity.ok(wallet))
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/address/{address}")
    public ResponseEntity<WalletDto> getWalletByAddress(@PathVariable String address) {
        return walletService.getWalletByAddress(address)
                .map(wallet -> ResponseEntity.ok(wallet))
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping("/{walletId}/refresh-balance")
    public ResponseEntity<Void> refreshWalletBalance(@PathVariable Long walletId) {
        walletService.refreshWalletBalance(walletId);
        return ResponseEntity.ok().build();
    }
    
    @DeleteMapping("/{walletId}")
    public ResponseEntity<Void> deactivateWallet(@PathVariable Long walletId) {
        walletService.deactivateWallet(walletId);
        return ResponseEntity.noContent().build();
    }
}