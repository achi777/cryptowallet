package com.cryptowallet.controller;

import com.cryptowallet.dto.SendTransactionDto;
import com.cryptowallet.dto.TransactionDto;
import com.cryptowallet.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class TransactionController {
    
    private final TransactionService transactionService;
    
    @PostMapping("/send")
    public ResponseEntity<TransactionDto> sendTransaction(@Valid @RequestBody SendTransactionDto sendDto) {
        TransactionDto transaction = transactionService.sendTransaction(sendDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(transaction);
    }
    
    @GetMapping("/wallet/{walletId}")
    public ResponseEntity<List<TransactionDto>> getWalletTransactions(@PathVariable Long walletId) {
        List<TransactionDto> transactions = transactionService.getWalletTransactions(walletId);
        return ResponseEntity.ok(transactions);
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<TransactionDto>> getUserTransactions(@PathVariable Long userId) {
        List<TransactionDto> transactions = transactionService.getUserTransactions(userId);
        return ResponseEntity.ok(transactions);
    }
    
    @GetMapping("/hash/{txHash}")
    public ResponseEntity<TransactionDto> getTransactionByHash(@PathVariable String txHash) {
        return transactionService.getTransactionByHash(txHash)
                .map(transaction -> ResponseEntity.ok(transaction))
                .orElse(ResponseEntity.notFound().build());
    }
}