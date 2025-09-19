package com.cryptowallet.service;

import com.cryptowallet.dto.SendTransactionDto;
import com.cryptowallet.dto.TransactionDto;
import com.cryptowallet.entity.Transaction;
import com.cryptowallet.entity.Wallet;
import com.cryptowallet.repository.TransactionRepository;
import com.cryptowallet.repository.WalletRepository;
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
    
    public Page<TransactionDto> getAllTransactionsPaged(Pageable pageable) {
        Page<Transaction> transactions = transactionRepository.findAll(pageable);
        return transactions.map(this::convertToDto);
    }
    
    // Create sample transactions for testing
    @Transactional
    public void createSampleTransactions() {
        List<Wallet> wallets = walletRepository.findAll();
        if (wallets.size() < 2) return;
        
        // Update wallet balances first
        Wallet wallet1 = wallets.get(0);
        Wallet wallet2 = wallets.get(1);
        
        wallet1.setBalance(new BigDecimal("1.50000000"));
        wallet2.setBalance(new BigDecimal("0.00100000"));
        walletRepository.save(wallet1);
        walletRepository.save(wallet2);
        
        // Create sample transactions
        Transaction tx1 = Transaction.builder()
                .txHash("test_tx_1_" + System.currentTimeMillis())
                .fromAddress("test_sender_address_1")
                .toAddress(wallet1.getAddress())
                .amount(new BigDecimal("1.50000000"))
                .fee(new BigDecimal("0.00001000"))
                .type(Transaction.TransactionType.RECEIVE)
                .status(Transaction.TransactionStatus.CONFIRMED)
                .wallet(wallet1)
                .blockNumber(800000L)
                .confirmations(6)
                .memo("Test incoming transaction")
                .build();
        
        Transaction tx2 = Transaction.builder()
                .txHash("test_tx_2_" + System.currentTimeMillis())
                .fromAddress(wallet2.getAddress())
                .toAddress("test_recipient_address")
                .amount(new BigDecimal("0.00050000"))
                .fee(new BigDecimal("0.00000500"))
                .type(Transaction.TransactionType.SEND)
                .status(Transaction.TransactionStatus.CONFIRMED)
                .wallet(wallet2)
                .blockNumber(800001L)
                .confirmations(3)
                .memo("Test outgoing transaction")
                .build();
        
        Transaction tx3 = Transaction.builder()
                .txHash("test_tx_3_" + System.currentTimeMillis())
                .fromAddress("test_sender_address_2")
                .toAddress(wallet2.getAddress())
                .amount(new BigDecimal("0.00100000"))
                .fee(new BigDecimal("0.00000200"))
                .type(Transaction.TransactionType.RECEIVE)
                .status(Transaction.TransactionStatus.PENDING)
                .wallet(wallet2)
                .blockNumber(null)
                .confirmations(0)
                .memo("Pending transaction")
                .build();
        
        transactionRepository.save(tx1);
        transactionRepository.save(tx2);
        transactionRepository.save(tx3);
        
        log.info("Created sample transactions for testing");
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