package com.cryptowallet.service;

import com.cryptowallet.entity.Wallet;
import com.cryptowallet.service.crypto.KeyPair;
import com.cryptowallet.service.crypto.TransactionResult;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.math.BigInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

class TronWalletServiceTest {

    private final TronWalletService service = new TronWalletService();

    @Test
    void supportedCurrencyIsUsdtTrc20() {
        assertThat(service.supportedCurrency()).isEqualTo(Wallet.CryptoCurrency.USDT_TRC20);
    }

    @Test
    void generateAddressReturnsNonNullKeyPair() {
        KeyPair keyPair = service.generateAddress();

        assertThat(keyPair).isNotNull();
        assertThat(keyPair.getAddress()).isNotNull().isNotEmpty().startsWith("T");
        assertThat(keyPair.getPrivateKey()).isNotNull().isNotEmpty();
    }

    @Test
    void generatedAddressLengthIsConsistent() {
        KeyPair keyPair = service.generateAddress();

        // "T" + 34 hex chars from pubkey (substring(2, 36)) = 35 chars
        assertThat(keyPair.getAddress()).hasSize(35);
    }

    @Test
    void generateAddressYieldsDistinctKeyPairsAcrossCalls() {
        KeyPair first = service.generateAddress();
        KeyPair second = service.generateAddress();

        assertThat(first.getAddress()).isNotEqualTo(second.getAddress());
        assertThat(first.getPrivateKey()).isNotEqualTo(second.getPrivateKey());
    }

    @Test
    void generatedPrivateKeyIsHexWithPrefix() {
        KeyPair keyPair = service.generateAddress();
        String privateKey = keyPair.getPrivateKey();

        assertThat(privateKey).startsWith("0x");
        // "0x" + up to 64 hex chars (web3j may trim leading zeros).
        assertThat(privateKey.length()).isGreaterThanOrEqualTo(3).isLessThanOrEqualTo(66);

        BigInteger parsed = new BigInteger(privateKey.substring(2), 16);
        assertThat(parsed).isPositive();
    }

    @Test
    void getBalanceReturnsNonNegativeBigDecimal() {
        BigDecimal balance = service.getBalance("Tanyaddress");

        assertThat(balance).isNotNull();
        assertThat(balance).isGreaterThanOrEqualTo(BigDecimal.ZERO);
    }

    @Test
    void getBalanceWithNullAddressDoesNotThrow() {
        // Current impl wraps body in try/catch — call must not throw.
        assertThatCode(() -> {
            BigDecimal balance = service.getBalance(null);
            assertThat(balance).isNotNull();
        }).doesNotThrowAnyException();
    }

    @Test
    void getBalanceWithEmptyAddressDoesNotThrow() {
        assertThatCode(() -> {
            BigDecimal balance = service.getBalance("");
            assertThat(balance).isNotNull().isGreaterThanOrEqualTo(BigDecimal.ZERO);
        }).doesNotThrowAnyException();
    }

    @Test
    void sendTransactionReturnsResultWithTxHashAndFee() {
        TransactionResult result = service.sendTransaction(
                "dummyKey", "Trecipient", new BigDecimal("10"));

        assertThat(result).isNotNull();
        assertThat(result.getTxHash()).isNotNull().startsWith("tron_tx_");
        assertThat(result.getFee()).isNotNull();
        assertThat(result.getFee().compareTo(BigDecimal.ZERO)).isPositive();
    }

    @Test
    void sendTransactionWithZeroAmountStillReturnsResult() {
        TransactionResult result = service.sendTransaction(
                "dummyKey", "Trecipient", BigDecimal.ZERO);

        assertThat(result).isNotNull();
        assertThat(result.getTxHash()).startsWith("tron_tx_");
        assertThat(result.getFee()).isNotNull();
    }

    @Test
    void getTrxBalanceReturnsNonNegativeBigDecimal() {
        BigDecimal balance = service.getTrxBalance("Tanyaddress");

        assertThat(balance).isNotNull();
        assertThat(balance).isGreaterThanOrEqualTo(BigDecimal.ZERO);
    }

    @Test
    void getTrxBalanceWithNullAddressDoesNotThrow() {
        assertThatCode(() -> {
            BigDecimal balance = service.getTrxBalance(null);
            assertThat(balance).isNotNull();
        }).doesNotThrowAnyException();
    }
}
