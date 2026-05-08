package com.cryptowallet.service;

import com.cryptowallet.entity.Wallet;
import com.cryptowallet.service.crypto.KeyPair;
import com.cryptowallet.service.crypto.TransactionResult;
import org.bitcoinj.core.DumpedPrivateKey;
import org.bitcoinj.params.TestNet3Params;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

class BitcoinWalletServiceTest {

    private final BitcoinWalletService service = new BitcoinWalletService();

    @Test
    void supportedCurrencyIsBitcoin() {
        assertThat(service.supportedCurrency()).isEqualTo(Wallet.CryptoCurrency.BITCOIN);
    }

    @Test
    void generateAddressReturnsNonNullKeyPair() {
        KeyPair keyPair = service.generateAddress();

        assertThat(keyPair).isNotNull();
        assertThat(keyPair.getAddress()).isNotNull().isNotEmpty().startsWith("bc1q");
        assertThat(keyPair.getPrivateKey()).isNotNull().isNotEmpty();
    }

    @Test
    void generateAddressYieldsDistinctKeyPairsAcrossCalls() {
        KeyPair first = service.generateAddress();
        KeyPair second = service.generateAddress();

        assertThat(first.getAddress()).isNotEqualTo(second.getAddress());
        assertThat(first.getPrivateKey()).isNotEqualTo(second.getPrivateKey());
    }

    @Test
    void generatedAddressLengthIsConsistent() {
        KeyPair keyPair = service.generateAddress();

        // "bc1q" prefix (4 chars) + first 32 hex chars of pubkey = 36 chars
        assertThat(keyPair.getAddress()).hasSize(36);
    }

    @Test
    void generatedPrivateKeyIsBitcoinjWifFormat() {
        KeyPair keyPair = service.generateAddress();

        // Round-trip parse the WIF — succeeds iff format/checksum are valid for testnet.
        assertThatCode(() ->
                DumpedPrivateKey.fromBase58(TestNet3Params.get(), keyPair.getPrivateKey())
        ).doesNotThrowAnyException();
    }

    @Test
    void getBalanceReturnsNonNegativeBigDecimal() {
        BigDecimal balance = service.getBalance("bc1qany");

        assertThat(balance).isNotNull();
        assertThat(balance).isGreaterThanOrEqualTo(BigDecimal.ZERO);
    }

    @Test
    void getBalanceWithNullAddressDoesNotThrow() {
        // Current impl wraps body in try/catch and never references the address arg
        // beyond logging — call must not throw and must return a non-null result.
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
                "dummyKey", "bc1qrecipient", new BigDecimal("0.001"));

        assertThat(result).isNotNull();
        assertThat(result.getTxHash()).isNotNull().startsWith("bitcoin_tx_");
        assertThat(result.getFee()).isNotNull();
        assertThat(result.getFee().compareTo(BigDecimal.ZERO)).isPositive();
    }

    @Test
    void sendTransactionWithZeroAmountStillReturnsResult() {
        // Stub impl ignores amount — documents current behavior.
        TransactionResult result = service.sendTransaction(
                "dummyKey", "bc1qrecipient", BigDecimal.ZERO);

        assertThat(result).isNotNull();
        assertThat(result.getTxHash()).startsWith("bitcoin_tx_");
        assertThat(result.getFee()).isNotNull();
    }
}
