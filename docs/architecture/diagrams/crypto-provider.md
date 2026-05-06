# CryptoProvider abstraction

The class diagram for the `CryptoProvider` extraction
(`REFACTOR-CRYPTO-PROVIDER`). Application services depend on the
interface; the registry resolves the right implementation per `Chain`.

```mermaid
classDiagram
    direction LR

    class WalletService {
        -CryptoProviderRegistry registry
        -PrivateKeyStore keyStore
        -WalletRepository wallets
        +createWallet(userId, chain) Wallet
        +listWallets(userId) List~Wallet~
        +balanceOf(walletId) Money
    }

    class TransactionService {
        -CryptoProviderRegistry registry
        -TxStateMachineService stateMachine
        -TransactionRepository transactions
        +send(walletId, to, amount) Transaction
        +history(walletId) List~Transaction~
    }

    class CryptoProviderRegistry {
        -Map~Chain, CryptoProvider~ providers
        +forChain(chain) CryptoProvider
    }

    class CryptoProvider {
        <<interface>>
        +chain() Chain
        +generateKeyPair() GeneratedKeyPair
        +addressOf(publicKey) String
        +fetchBalance(address) Money
        +broadcastTransfer(signedTransfer) String
        +statusOf(txHash) OnChainStatus
    }

    class BitcoinCryptoProvider {
        -BitcoinJClient client
        +chain() Chain
        +generateKeyPair() GeneratedKeyPair
        +addressOf(publicKey) String
        +fetchBalance(address) Money
        +broadcastTransfer(signedTransfer) String
        +statusOf(txHash) OnChainStatus
    }

    class TronCryptoProvider {
        -Web3jTronClient client
        +chain() Chain
        +generateKeyPair() GeneratedKeyPair
        +addressOf(publicKey) String
        +fetchBalance(address) Money
        +broadcastTransfer(signedTransfer) String
        +statusOf(txHash) OnChainStatus
    }

    class PrivateKeyStore {
        <<interface>>
        +put(walletId, material) EncryptedKeyHandle
        +get(handle) PrivateKeyMaterial
        +rewrap(handle) EncryptedKeyHandle
    }

    class Aes256GcmKeyStore {
        -SecretKey kek
        +put(walletId, material) EncryptedKeyHandle
        +get(handle) PrivateKeyMaterial
        +rewrap(handle) EncryptedKeyHandle
    }

    WalletService --> CryptoProviderRegistry
    WalletService --> PrivateKeyStore
    TransactionService --> CryptoProviderRegistry

    CryptoProviderRegistry o-- CryptoProvider : registers

    CryptoProvider <|.. BitcoinCryptoProvider
    CryptoProvider <|.. TronCryptoProvider

    PrivateKeyStore <|.. Aes256GcmKeyStore
```

**Notes**

- `WalletService` and `TransactionService` never reference
  `BitcoinCryptoProvider` or `TronCryptoProvider` by name. Tests substitute
  an `InMemoryCryptoProvider` via the registry.
- Every method on `CryptoProvider` operates on `domain.*` types. No
  BitcoinJ or Web3j types leak through the interface.
- A future `EthereumCryptoProvider` would land as a third implementation
  with no change to the interface or its callers — but that is explicitly
  out of scope for the current sprint (see `ARCHITECTURE.md` §8).
