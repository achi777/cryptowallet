# System context

End-to-end view of how a browser request reaches a confirmed on-chain
transaction in the post-refactor architecture. Two external networks
(Bitcoin testnet/mainnet and the Tron HTTP node) sit on the right; the
deployment boundary (Docker Compose stack) is the dashed group on the
left.

```mermaid
graph LR
    Browser["Browser<br/>(end user / admin)"]

    subgraph Compose["Docker Compose stack"]
        SPA["React SPA<br/>(single bundle, role-guarded routes)"]
        API["Spring Boot API<br/>com.cryptowallet.wallet"]
        DB[("PostgreSQL 15<br/>users, wallets,<br/>transactions, audit_log")]
    end

    BTCNet["Bitcoin network<br/>(testnet / mainnet,<br/>via BitcoinJ peers)"]
    TronNet["Tron HTTP node<br/>(api.trongrid.io,<br/>via Web3j)"]

    Browser -- "HTTPS, JWT bearer" --> SPA
    SPA -- "/api/** (Axios)" --> API
    API -- "JDBC, Flyway-managed schema" --> DB
    API -- "BitcoinJ peer-group" --> BTCNet
    API -- "Web3j JSON-RPC" --> TronNet
```

**Notes**

- The SPA is served by its own container (Nginx serving the CRA/Vite
  build); the Spring Boot API does not serve static assets. The arrow
  from `Browser → SPA` and `SPA → API` are separate hops.
- Auth is stateless JWT; the `Authorization: Bearer <token>` header is
  attached by `lib/api.ts`'s Axios interceptor.
- Outbound connections to BTC and Tron networks are the only
  reaches outside the Compose stack.
- The H2 in-memory database used in `dev` is intentionally not shown — it
  is dev-only and lives inside the API process.
