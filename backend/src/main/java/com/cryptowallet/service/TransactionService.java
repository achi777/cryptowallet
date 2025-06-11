package com.cryptowallet.service;

import com.cryptowallet.dto.SendTransactionDto;
import com.cryptowallet.dto.TransactionDto;
import com.cryptowallet.entity.Transaction;
import com.cryptowallet.entity.Wallet;
import com.cryptowallet.repository.TransactionRepository;
import com.cryptowallet.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
public class TransactionService {
    
    private final TransactionRepository transactionRepository;
    private final WalletRepository walletRepository;
    private final BitcoinWalletService bitcoinWalletService;
    private final TronWalletService tronWalletService;
    
    public TransactionDto sendTransaction(SendTransactionDto sendDto) {
        Wallet wallet = walletRepository.findById(sendDto.getWalletId())
                .orElseThrow(() -> new RuntimeException("Wallet not found"));
        
        if (wallet.getBalance().compareTo(sendDto.getAmount()) < 0) {
            throw new RuntimeException("Insufficient balance");
        }
        
        String txHash;
        BigDecimal fee;
        
        try {
            switch (wallet.getCurrency()) {
                case BITCOIN -> {
                    var result = bitcoinWalletService.sendTransaction(
                            wallet.getPrivateKey(),
                            sendDto.getToAddress(),
                            sendDto.getAmount()
                    );
                    txHash = result.getTxHash();
                    fee = result.getFee();
                }
                case USDT_TRC20 -> {
                    var result = tronWalletService.sendUsdtTransaction(
                            wallet.getPrivateKey(),
                            sendDto.getToAddress(),
                            sendDto.getAmount()
                    );
                    txHash = result.getTxHash();
                    fee = result.getFee();
                }
                default -> throw new RuntimeException("Unsupported currency: " + wallet.getCurrency());
            }
            
            Transaction transaction = Transaction.builder()
                    .txHash(txHash)
                    .fromAddress(wallet.getAddress())
                    .toAddress(sendDto.getToAddress())
                    .amount(sendDto.getAmount())
                    .fee(fee)
                    .type(Transaction.TransactionType.SEND)
                    .status(Transaction.TransactionStatus.PENDING)
                    .wallet(wallet)
                    .memo(sendDto.getMemo())
                    .build();
            
            Transaction savedTransaction = transactionRepository.save(transaction);
            
            // Update wallet balance
            BigDecimal newBalance = wallet.getBalance()
                    .subtract(sendDto.getAmount())
                    .subtract(fee);
            wallet.setBalance(newBalance);
            walletRepository.save(wallet);
            
            log.info("Transaction sent successfully: {} from {} to {}", 
                    txHash, wallet.getAddress(), sendDto.getToAddress());
            
            return convertToDto(savedTransaction);
            
        } catch (Exception e) {
            log.error("Failed to send transaction: {}", e.getMessage());
            throw new RuntimeException("Failed to send transaction: " + e.getMessage());
        }
    }
    
    @Transactional(readOnly = true)
    public List<TransactionDto> getWalletTransactions(Long walletId) {
        return transactionRepository.findByWalletIdOrderByCreatedAtDesc(walletId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<TransactionDto> getUserTransactions(Long userId) {
        return transactionRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public Optional<TransactionDto> getTransactionByHash(String txHash) {
        return transactionRepository.findByTxHash(txHash)
                .map(this::convertToDto);
    }
    
    public void updateTransactionStatus(String txHash, Transaction.TransactionStatus status, 
                                       Long blockNumber, Integer confirmations) {
        Transaction transaction = transactionRepository.findByTxHash(txHash)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
        
        transaction.setStatus(status);
        transaction.setBlockNumber(blockNumber);
        transaction.setConfirmations(confirmations);
        
        transactionRepository.save(transaction);
        
        log.info("Transaction status updated: {} - Status: {}", txHash, status);
    }
    
    public void processIncomingTransaction(String txHash, String toAddress, BigDecimal amount, 
                                         String fromAddress, Long blockNumber) {
        // Check if transaction already exists
        if (transactionRepository.findByTxHash(txHash).isPresent()) {
            return;
        }
        
        Wallet wallet = walletRepository.findByAddress(toAddress)
                .orElse(null);
        
        if (wallet != null) {
            Transaction transaction = Transaction.builder()
                    .txHash(txHash)
                    .fromAddress(fromAddress)
                    .toAddress(toAddress)
                    .amount(amount)
                    .type(Transaction.TransactionType.RECEIVE)
                    .status(Transaction.TransactionStatus.CONFIRMED)
                    .wallet(wallet)
                    .blockNumber(blockNumber)
                    .build();
            
            transactionRepository.save(transaction);
            
            // Update wallet balance
            BigDecimal newBalance = wallet.getBalance().add(amount);
            wallet.setBalance(newBalance);
            walletRepository.save(wallet);
            
            log.info("Incoming transaction processed: {} to {}", txHash, toAddress);
        }
    }
    
    private TransactionDto convertToDto(Transaction transaction) {
        TransactionDto dto = new TransactionDto();
        dto.setId(transaction.getId());
        dto.setTxHash(transaction.getTxHash());
        dto.setFromAddress(transaction.getFromAddress());
        dto.setToAddress(transaction.getToAddress());
        dto.setAmount(transaction.getAmount());
        dto.setFee(transaction.getFee());
        dto.setType(transaction.getType());
        dto.setStatus(transaction.getStatus());
        dto.setBlockNumber(transaction.getBlockNumber());
        dto.setConfirmations(transaction.getConfirmations());
        dto.setMemo(transaction.getMemo());
        dto.setCreatedAt(transaction.getCreatedAt());
        return dto;
    }
}