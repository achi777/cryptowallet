package com.cryptowallet.service.crypto;

import com.cryptowallet.entity.Wallet;

import java.math.BigDecimal;

public interface CryptoProvider {

    Wallet.CryptoCurrency supportedCurrency();

    KeyPair generateAddress();

    BigDecimal getBalance(String address);

    TransactionResult sendTransaction(String privateKey, String toAddress, BigDecimal amount);
}
