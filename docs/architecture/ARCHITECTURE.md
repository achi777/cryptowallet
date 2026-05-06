# CryptoWallet — Target Architecture (post-refactor)

> Status: target state. The current code in `code/cryptowallet/` is the "before".
> This document is the "after". Each section describes what the codebase should
> look like once the sprint listed in `PROJECT_OVERVIEW.md` lands. No file in
> `code/cryptowallet/` is edited during the architecture phase; that work lands
> ticket-by-ticket in the development phase.

---

## 1. Goals

1. Refactor for **testability** (push business logic behind interfaces; cover
   the crypto layer with unit tests *before* moving it).
2. Refactor for **security** (encrypt private keys at rest, lock down the H2
   console, collapse the duplicated admin path so the auth surface is one
   thing).
3. Refactor for **maintainability** (one user model, one SPA, one API client,
   one transaction lifecycle), shipped as **small, reviewable PRs** that each
   preserve current behaviour.

Non-goal: changing what the product does. Every existing endpoint and screen
must keep working byte-for-byte from the user's point of view at the end of
each ticket.

---

## 2. Constraints

### What we are NOT changing

| Area | Stays as-is | Why |
| --- | --- | --- |
| Language / runtime | Java 21, Spring Boot 3.2 | Already current; no migration value. |
| Crypto libraries | BitcoinJ 0.16.2, Web3j 4.10.3 | Already integrated; switching libs is a separate, larger project. |
| Supported chains | BTC + Tron/USDT (TRC-20) | Product scope. No new chains in this sprint. |
| Persistence (prod) | PostgreSQL 15 | Schema changes are additive (see `data-model.md`); engine is unchanged. |
| Persistence (dev) | H2 in-memory | Kept for `dev` profile; locked out of `prod` / `staging`. |
| HTTP client (frontend) | Axios | Wrapped, not replaced. |
| Visual design | Existing glass-morphism CSS | User said "NO UI". Pixels are frozen. |
| Deployment | `docker-compose.yml` (Postgres + backend + frontend) | Same Compose file post-refactor; only build commands inside containers shift if/when CRA → Vite. |
| Maven coordinates | `groupId=com.cryptowallet`, `artifactId=crypto-wallet-backend` | No reason to rename. |

### What we ARE changing

| Area | Change |
| --- | --- |
| Backend package layout | Re-organise under `com.cryptowallet.wallet.*` with `domain / crypto / auth / tx / web / infra / config`. |
| Auth model | Collapse `User` and `Admin` entities/repos/services/controllers into a single `User` with a `Role` enum. |
| Crypto layer | Extract `CryptoProvider` interface; `WalletService` / `TransactionService` depend on it, not on `BitcoinWalletService` / `TronWalletService`. |
| Transactions | Introduce explicit `TxStateMachine` over `TxState { PENDING, BROADCAST, CONFIRMED, FAILED }`. |
| Private keys | Introduce `PrivateKeyStore` abstraction with at-rest encryption (`Aes256GcmKeyStore`). |
| H2 console | Disabled in `prod` and `staging` profiles. |
| Frontend | Merge `App.tsx` + `AdminApp.tsx` into one SPA + router with role-guarded `/admin/*` routes. |
| Frontend types | TypeScript 5.x; align `@types/react@19` and `@types/node@22`; drop `@types/axios`. |
| Frontend build | Optional move from CRA to Vite (`MIGRATE-OFF-CRA`, last in the dependency chain). |
| Repo hygiene | Remove `__MACOSX/`, `.DS_Store`, committed `*.log`; add `.gitignore` rules. |
| DB migrations | Introduce **Flyway** (project currently has none — `ddl-auto: update`). All schema becomes versioned SQL. |

---

## 3. Backend target package layout

Root package: `com.cryptowallet.wallet` (today the code lives directly under
`com.cryptowallet`, with subpackages `controller / service / repository /
entity / dto / config`). The new layout introduces a clean separation between
*domain* (pure model), *infra* (JPA), and the new feature packages
(`crypto`, `auth`, `tx`, `web`).

```
src/main/java/com/cryptowallet/wallet/
├── CryptoWalletApplication.java          // unchanged entry point
│
├── domain/                               // PURE: no Spring, no JPA imports
│   ├── User.java                         // record-or-class with id, email, role, ...
│   ├── Wallet.java                       // record with id, ownerId, chain, address, ...
│   ├── Transaction.java                  // record with id, walletId, state, amount, ...
│   ├── Role.java                         // enum { CUSTOMER, ADMIN }
│   ├── Chain.java                        // enum { BTC, TRON }
│   ├── TxState.java                      // enum { PENDING, BROADCAST, CONFIRMED, FAILED }
│   ├── TxDirection.java                  // enum { IN, OUT }
│   └── Money.java                        // BigDecimal wrapper, asserts scale by chain
│
├── crypto/                               // chain-specific code, hidden behind an interface
│   ├── CryptoProvider.java               // interface (see §4.1)
│   ├── BitcoinCryptoProvider.java        // @Service @Qualifier("BTC")
│   ├── TronCryptoProvider.java           // @Service @Qualifier("TRON")
│   ├── CryptoProviderRegistry.java       // resolves Chain -> CryptoProvider
│   └── keys/
│       ├── PrivateKeyStore.java          // interface (see §4.4)
│       └── Aes256GcmKeyStore.java        // default impl, KEK from env
│
├── auth/                                 // identity + Spring Security
│   ├── SecurityConfig.java               // single SecurityFilterChain bean (see §6)
│   ├── UserDetailsServiceImpl.java       // adapts domain.User -> UserDetails
│   ├── JwtIssuer.java                    // signs HS256 tokens, 1h access + 7d refresh
│   ├── JwtAuthFilter.java                // OncePerRequestFilter
│   ├── PasswordEncoderConfig.java        // BCrypt, strength 12
│   └── AuthService.java                  // login / register / refresh
│
├── tx/                                   // transaction lifecycle
│   ├── TxState.java                      // re-exported from domain (kept here for clarity)
│   ├── TxEvent.java                      // enum { BROADCAST_OK, BROADCAST_FAIL, CONFIRM_RECEIVED, CONFIRM_TIMEOUT }
│   ├── TxStateMachine.java               // pure function over (state, event) -> state
│   ├── TxStateMachineService.java        // wraps repo + state machine + audit
│   ├── TxBroadcastJob.java               // @Scheduled poll for PENDING -> BROADCAST
│   └── TxConfirmJob.java                 // @Scheduled poll for BROADCAST -> CONFIRMED
│
├── application/                          // application services (root pkg is already `wallet`,
│   │                                     // so we don't nest another `wallet/` underneath it)
│   ├── WalletService.java                // depends on CryptoProvider, PrivateKeyStore
│   └── TransactionService.java           // depends on CryptoProvider, TxStateMachineService
│
├── web/                                  // HTTP boundary
│   ├── controller/
│   │   ├── AuthController.java           // /api/auth/**
│   │   ├── WalletController.java         // /api/wallets/**
│   │   ├── TransactionController.java    // /api/transactions/**
│   │   └── admin/
│   │       ├── AdminUserController.java  // /api/admin/users/**
│   │       ├── AdminWalletController.java// /api/admin/wallets/**
│   │       ├── AdminTxController.java    // /api/admin/transactions/**
│   │       └── AdminStatsController.java // /api/admin/stats
│   ├── dto/                              // request/response only — no JPA/domain leaks
│   │   ├── auth/   { LoginRequest, RegisterRequest, AuthResponse, RefreshRequest }
│   │   ├── wallet/ { WalletResponse, CreateWalletRequest }
│   │   ├── tx/     { SendTransactionRequest, TransactionResponse }
│   │   ├── user/   { UserResponse, ChangePasswordRequest }
│   │   └── admin/  { AdminStatsResponse, AdminUserListResponse }
│   ├── mapper/                           // domain <-> dto, hand-written
│   └── error/
│       ├── ApiError.java                 // RFC 7807 problem+json
│       └── GlobalExceptionHandler.java   // @ControllerAdvice
│
├── infra/                                // adapters: persistence, external HTTP, audit
│   ├── jpa/
│   │   ├── UserEntity.java               // @Entity, table USERS
│   │   ├── WalletEntity.java             // @Entity, table WALLETS
│   │   ├── TransactionEntity.java        // @Entity, table TRANSACTIONS
│   │   ├── AuditLogEntity.java           // @Entity, table AUDIT_LOG
│   │   ├── UserRepository.java           // extends JpaRepository<UserEntity, UUID>
│   │   ├── WalletRepository.java
│   │   ├── TransactionRepository.java
│   │   └── AuditLogRepository.java
│   ├── crypto/
│   │   ├── BitcoinJClient.java           // wraps BitcoinJ, single point of contact
│   │   └── Web3jTronClient.java          // wraps Web3j HTTP service
│   └── audit/
│       └── AuditLogger.java              // writes AuditLogEntity rows
│
└── config/                               // Spring @Configuration classes only
    ├── JpaConfig.java
    ├── ScheduledJobsConfig.java
    ├── DevH2ConsoleConfig.java           // @Profile("dev") only — see §6
    └── AppProperties.java                // @ConfigurationProperties("crypto")
```

### Layer rules (enforced by ArchUnit tests added in `UNIT-TESTS-CRYPTO-LAYER`)

1. `domain.*` may not import anything from `org.springframework`, `jakarta.persistence`, `com.fasterxml.jackson`, `org.bitcoinj`, `org.web3j`. It is portable Java.
2. `web.*` may not import `infra.*` directly. Controllers depend on application services in `auth`, `wallet`, `tx`.
3. `infra.jpa.*Entity` classes never escape `infra.jpa.*`. Mappers convert to `domain.*` records on the way out of the repository layer.
4. `crypto.*` may not depend on `infra.jpa.*`. Crypto providers are pure code that takes domain inputs and returns domain outputs. Persistence is the caller's responsibility.

### Naming conventions

- JPA classes: `XxxEntity` (so `User` and `UserEntity` are clearly distinct).
- DTOs: `XxxRequest` / `XxxResponse` — no shared "Dto" name for both directions.
- Controllers: one per resource, suffix `Controller`. Admin counterparts live in `web.controller.admin`, never re-implement business logic — they call the same application services with `@PreAuthorize("hasRole('ADMIN')")`.

---

## 4. Backend abstractions to introduce

### 4.1 `interface CryptoProvider`

```java
package com.cryptowallet.wallet.crypto;

public interface CryptoProvider {

    Chain chain();                                       // BTC | TRON

    /** Generate a fresh keypair for a brand-new wallet. */
    GeneratedKeyPair generateKeyPair();

    /** Derive the public on-chain address from the public key. */
    String addressOf(PublicKey publicKey);

    /** Read on-chain balance for an address; returns Money in chain-native units. */
    Money fetchBalance(String address);

    /** Build, sign, and broadcast a transfer. Returns the on-chain tx hash. */
    String broadcastTransfer(SignedTransfer transfer);

    /** Look up the on-chain status of a previously-broadcast tx. */
    OnChainStatus statusOf(String txHash);
}
```

**Why it exists.** Today `WalletService` and `TransactionService` switch on
chain (`if (chain == BTC) ... else ...`) and call into `BitcoinWalletService`
and `TronWalletService` directly. That's not testable (real BitcoinJ wants a
peer group) and it spreads chain-specific knowledge across application code.

**What it replaces.** Direct dependencies from `WalletService` /
`TransactionService` on `BitcoinWalletService` and `TronWalletService`.
Application services now ask `CryptoProviderRegistry.forChain(chain)` and use
the returned `CryptoProvider`.

**Two implementations land at refactor time:**
- `BitcoinCryptoProvider` — wraps `infra.crypto.BitcoinJClient`.
- `TronCryptoProvider` — wraps `infra.crypto.Web3jTronClient`.

A fake `InMemoryCryptoProvider` lives in test sources and is what
`UNIT-TESTS-CRYPTO-LAYER` exercises against application services.

### 4.2 `class TxStateMachine`

```java
package com.cryptowallet.wallet.tx;

public final class TxStateMachine {
    public TxState next(TxState current, TxEvent event) {
        return switch (current) {
            case PENDING    -> switch (event) {
                case BROADCAST_OK     -> TxState.BROADCAST;
                case BROADCAST_FAIL   -> TxState.FAILED;
                default               -> illegal(current, event);
            };
            case BROADCAST  -> switch (event) {
                case CONFIRM_RECEIVED -> TxState.CONFIRMED;
                case CONFIRM_TIMEOUT  -> TxState.FAILED;
                default               -> illegal(current, event);
            };
            case CONFIRMED, FAILED -> illegal(current, event);
        };
    }
}
```

Pure function. No Spring, no JPA. The wrapper service `TxStateMachineService`
is the integration point: it loads the transaction, calls
`TxStateMachine.next`, persists, and emits an `AuditLog` entry.

**Why it exists.** Today the transaction lifecycle is implicit — flags and
booleans set in three different services. An explicit machine forces every
write to declare the event that caused it, makes invalid transitions a
compile-time/throw-at-runtime concern, and gives the audit log a clean
`(before, event, after)` shape.

**What it replaces.** Ad-hoc setters on `Transaction` (`setStatus("sent")`,
etc.) called from multiple services.

### 4.3 Role-based identity

Today: separate `entity/User.java` and `entity/Admin.java`, separate repos,
separate services, separate controllers, separate DTOs.

Target: a single `domain.User` record, a single `infra.jpa.UserEntity`,
a single `infra.jpa.UserRepository`, a single `auth.AuthService`. The only
distinction between a customer and a support engineer is `User.role`.

```java
package com.cryptowallet.wallet.domain;

public enum Role { CUSTOMER, ADMIN }

public record User(
    UUID id,
    String email,
    String passwordHash,            // BCrypt; never leaves the server
    Role role,
    Instant createdAt,
    Instant updatedAt
) {}
```

Spring Security maps `Role.ADMIN` → authority `ROLE_ADMIN` and `Role.CUSTOMER`
→ `ROLE_USER`. Admin endpoints declare `@PreAuthorize("hasRole('ADMIN')")`.

**What it replaces.** `entity/Admin.java`, `repository/AdminRepository.java`,
`service/AdminService.java`, `dto/AdminDto.java`, `dto/AdminLoginDto.java`,
`dto/AdminRegistrationDto.java`, `controller/AdminController.java`'s auth
endpoints. Admin-specific *features* (stats, dashboards, user management)
remain — they move under `web.controller.admin.*` and call into the same
application services as customer endpoints, just with extra authority checks.

### 4.4 `interface PrivateKeyStore`

```java
package com.cryptowallet.wallet.crypto.keys;

public interface PrivateKeyStore {

    /** Encrypt and persist; returns an opaque handle stored on the Wallet row. */
    EncryptedKeyHandle put(WalletId walletId, PrivateKeyMaterial material);

    /** Decrypt at point of use only. Caller must zero the returned material ASAP. */
    PrivateKeyMaterial get(EncryptedKeyHandle handle);

    /** For key-rotation jobs. */
    EncryptedKeyHandle rewrap(EncryptedKeyHandle handle);
}
```

Default impl: `Aes256GcmKeyStore`.

- AES-256-GCM with a fresh random 96-bit IV per record.
- The 256-bit Key-Encryption-Key (KEK) is read from env var `WALLET_KEK`
  (base64-encoded) at boot via `AppProperties`. Boot fails fast if it is
  missing in `prod` / `staging`. In `dev` the KEK falls back to a
  documented test value.
- Ciphertext is stored directly in `wallets.encrypted_private_key` as
  `BYTEA`; format = `version(1B) || iv(12B) || ciphertext+tag`.
- Future plug-in impls: `AwsKmsKeyStore`, `VaultTransitKeyStore`. They
  implement the same interface; no caller changes. The interface is
  intentionally narrow so KMS implementations don't have to expose key
  material to the JVM.

**What it replaces.** Today the wallet entity stores a private key field
in the clear (or trivially encoded). The `HARDEN-H2-CONSOLE` ticket also
covers introducing this store and migrating existing rows; see
`data-model.md` for the migration script.

### 4.5 Audit logging

`infra.audit.AuditLogger.log(actorUserId, action, targetType, targetId, payload)`
writes an `AuditLogEntity` row in the same transaction as the change being
audited. Called from:
- `AuthService` on login / failed login / password change.
- `TxStateMachineService` on every state transition.
- `WalletService` on wallet creation.
- Admin controllers wrap mutating endpoints with audit calls.

**Why now.** The state machine refactor is the cheapest moment to wire audit
in: every mutation already flows through the machine.

---

## 5. Frontend target layout

Single SPA. One `index.html`, one `index.tsx`, one router. The current
`admin.html` + `admin.tsx` + `AdminApp.tsx` triple goes away in
`MERGE-DUAL-SPAS`.

```
frontend/src/
├── main.tsx                              // single entry (renamed from index.tsx if Vite)
├── app/
│   ├── App.tsx                           // RouterProvider + global providers
│   ├── routes.tsx                        // route tree (see below)
│   └── providers/
│       ├── AuthProvider.tsx              // exposes useAuth(), token + user
│       └── QueryProvider.tsx             // optional: TanStack Query, only if hooks need it
│
├── pages/
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   └── RegisterPage.tsx
│   ├── wallet/
│   │   ├── WalletListPage.tsx
│   │   ├── WalletDetailPage.tsx
│   │   ├── SendPage.tsx
│   │   └── TransactionHistoryPage.tsx
│   └── admin/
│       ├── AdminDashboardPage.tsx
│       ├── AdminUsersPage.tsx
│       ├── AdminWalletsPage.tsx
│       ├── AdminTransactionsPage.tsx
│       └── AdminSettingsPage.tsx
│
├── components/                           // existing components, unchanged visually
│   ├── TransactionForm.tsx
│   ├── WalletList.tsx
│   ├── TransactionHistory.tsx
│   └── admin/                            // moved from src/components/admin/, otherwise same
│       ├── AdminStats.tsx
│       ├── UserManagement.tsx
│       ├── WalletManagement.tsx
│       └── TransactionManagement.tsx
│
├── hooks/                                // typed hooks built on lib/api.ts
│   ├── useWallets.ts                     // GET /api/wallets/me
│   ├── useWallet.ts                      // GET /api/wallets/:id
│   ├── useSendTransaction.ts             // POST /api/transactions
│   ├── useTransactionHistory.ts          // GET /api/transactions?walletId=
│   └── admin/
│       ├── useAdminStats.ts
│       ├── useAdminUsers.ts
│       └── useAdminTransactions.ts
│
├── lib/
│   ├── api.ts                            // single Axios instance, interceptors for JWT + 401
│   ├── auth.ts                           // login(), logout(), getToken(), getUser()
│   └── env.ts                            // VITE_API_URL or REACT_APP_API_URL — interim
│
├── types/
│   └── index.ts                          // shared API response types (mirrors backend DTOs)
│
└── styles/                               // unchanged: globals.css, App.css, admin.css
```

### Route tree (`app/routes.tsx`)

Visualised, not the literal file:

```tsx
<RouterProvider router={createBrowserRouter([
  // Public
  { path: "/login",    element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },

  // Customer (logged-in, role CUSTOMER or ADMIN)
  { element: <RequireAuth />, children: [
    { path: "/",                       element: <WalletListPage /> },
    { path: "/wallets/:id",            element: <WalletDetailPage /> },
    { path: "/wallets/:id/send",       element: <SendPage /> },
    { path: "/wallets/:id/history",    element: <TransactionHistoryPage /> },
  ]},

  // Admin only
  { element: <RequireRole role="ADMIN" />, children: [
    { path: "/admin",                  element: <AdminDashboardPage /> },
    { path: "/admin/users",            element: <AdminUsersPage /> },
    { path: "/admin/wallets",          element: <AdminWalletsPage /> },
    { path: "/admin/transactions",     element: <AdminTransactionsPage /> },
    { path: "/admin/settings",         element: <AdminSettingsPage /> },
  ]},
])} />
```

`<RequireAuth />` reads from `AuthProvider`; if no token, navigates to
`/login` with `state.from` so post-login redirect works. `<RequireRole>` adds
a role check on top and renders 403 for authenticated-but-wrong-role users.

### `lib/api.ts` — single fetch client

One Axios instance. Request interceptor attaches `Authorization: Bearer
<token>` when present. Response interceptor:
- on `401`, calls `lib/auth.ts:logout()` and bubbles a typed
  `UnauthorizedError`;
- on `403`, bubbles `ForbiddenError` (used by `RequireRole`);
- on network failure, bubbles `NetworkError` so hooks can render retry UI
  without parsing strings.

Replaces both `services/api.ts` and `services/adminApi.ts` (the latter just
hits `/api/admin/*` paths, which the new client handles uniformly).

### Typed hooks

Each hook returns a tagged union:

```ts
type Result<T> =
  | { status: "loading" }
  | { status: "ok"; data: T }
  | { status: "error"; error: ApiError };
```

Hooks live next to the resource they own (`hooks/useWallets.ts`, etc.). The
admin variants under `hooks/admin/` simply hit `/api/admin/...` — same
client, different path. Components `import { useWallets } from
"@/hooks/useWallets"`, never import Axios directly.

### Build tooling

- Interim (default): keep CRA. The merge of the two SPAs does not require a
  build-tool change. `MERGE-DUAL-SPAS` ships first under CRA.
- Optional: `MIGRATE-OFF-CRA` — switch to **Vite 5** (lighter than Next; no
  SSR is needed for a logged-in dashboard SPA). Keep the public path,
  rename `index.tsx → main.tsx`, replace `process.env.REACT_APP_*` with
  `import.meta.env.VITE_*`, and update `package.json` scripts. CRA → Vite
  is mechanical once the SPAs are merged — that's why it sits last in the
  refactor order.

### TypeScript / type alignment

Target after `UPGRADE-TS-TYPES`:

| Package | Current | Target |
| --- | --- | --- |
| `typescript` | `^4.9.5` | `^5.4` |
| `@types/react` | `^19.1.8` | `^19.x` (kept) |
| `@types/react-dom` | `^19.1.6` | `^19.x` (kept) |
| `@types/node` | `^16.x` | `^22.x` (matches Node 22 LTS) |
| `@types/axios` | `^0.9.36` | **removed** — Axios 1.x ships its own types |

Strict mode is turned on (`"strict": true`, `"noUncheckedIndexedAccess":
true`); all type errors that surface get fixed inside the same ticket.

---

## 6. Security surface

### H2 console

- The `H2ConsoleAutoConfiguration` is excluded except in `dev`. Concretely:
  `application.yml` sets `spring.h2.console.enabled: false` at the root, and
  `application-dev.yml` overrides it to `true`. `prod` and `staging` profiles
  inherit the root value.
- `SecurityConfig` permits `/h2-console/**` only when the active profile is
  `dev` (`@Profile("dev")` on a small `WebSecurityCustomizer` bean). Outside
  `dev` the path 404s like any unmapped URL.

### Private-key encryption-at-rest

Already specified in §4.4. Concretely:

| Property | Value |
| --- | --- |
| Algorithm | AES-256-GCM (`AES/GCM/NoPadding`, JDK provider) |
| KEK source | `WALLET_KEK` env var, base64-encoded 32 bytes |
| KEK rotation | `Aes256GcmKeyStore.rewrap` reads with old KEK, writes with new; supports two-key window via `WALLET_KEK_PREVIOUS` |
| IV | 96 random bits per record, stored inline |
| Auth tag | 128-bit, GCM standard |
| Storage column | `wallets.encrypted_private_key BYTEA NOT NULL` |
| Boot guard | `AppProperties` validates KEK presence on `@PostConstruct`; missing in `prod`/`staging` → application fails to start |

The plain `private_key` column on `wallets` is dropped in the same Flyway
migration that introduces `encrypted_private_key` — see `data-model.md` for
the rewrap-then-drop sequence.

### Spring Security mapping

```
SecurityFilterChain (single chain)
  ┌── /api/auth/**           ........... permitAll        (login, register, refresh)
  ├── /api/admin/**          ........... hasRole("ADMIN")
  ├── /api/**                ........... authenticated    (defaults to ROLE_USER)
  ├── /h2-console/**         ........... permitAll, csrf disabled, frameOptions sameOrigin   [@Profile("dev")]
  └── everything else        ........... denyAll          (no static serving from backend; frontend is its own container)
```

Stateless: `SessionCreationPolicy.STATELESS`. Auth is JWT-bearer.
`JwtAuthFilter` sits before `UsernamePasswordAuthenticationFilter` and
populates `SecurityContextHolder` from a valid token; on a missing/invalid
token, downstream `AuthenticationEntryPoint` returns a 401 with
`application/problem+json`. CSRF is disabled because the API is JSON-only and
the SPA holds the token in memory (not in a cookie).

**Why JWT over a session bridge?** The current code already stores a token in
`localStorage` and the deploy is a single backend instance with a Postgres,
no shared session store; a stateless JWT is the smaller change, the easier
thing to test, and matches what the SPA already does. We accept the standard
JWT trade-offs (revocation done via short access-token TTL of 1h + refresh
endpoint).

### Repo hygiene

`.gitignore` additions:

```
# OS
.DS_Store
__MACOSX/
Thumbs.db

# Logs
*.log
**/logs/
backend.log
frontend.log

# IDE
.idea/
.vscode/
*.iml

# Build / runtime
target/
build/
node_modules/
dist/
.env
.env.*
!.env.example
```

`REPO-CLEAN` runs `git rm -r --cached __MACOSX/ .DS_Store *.log
**/.DS_Store` (and the equivalents under `backend/src/`,
`code/cryptowallet/`, etc.) plus a `BFG`-or-`filter-repo` pass *only* if the
team decides the historical artefacts are worth purging. Default
recommendation: don't rewrite history; just stop tracking them going
forward.

---

## 7. Refactor order — the sprint

Tickets are listed in dependency order. The numbering is for this document's
referencing only; Jira keys come from `PROJECT_OVERVIEW.md`. Two principles
drive the ordering:

1. **Tests before refactors** — `UNIT-TESTS-CRYPTO-LAYER` is *first* even
   though `PROJECT_OVERVIEW.md` lists it later. Refactoring un-tested crypto
   code is the textbook "don't" of safe refactoring.
2. **Backend abstractions before frontend collapse** — the SPA merge is
   safer when the API is already role-based.

| # | Ticket | What it changes | Depends on | Risk | Reviewable size |
| - | ------ | --------------- | ---------- | ---- | --------------- |
| 1 | `REPO-CLEAN` | Remove `__MACOSX/`, `.DS_Store`, `*.log`; add `.gitignore`. No code logic changes. | — | Very low | ~1 commit, ~50 lines diff (mostly deletions) |
| 2 | `UNIT-TESTS-CRYPTO-LAYER` | Add tests against current `BitcoinWalletService` / `TronWalletService` via a shim that pins their public surface. Establishes the behavioural contract every later refactor must preserve. | 1 | Low | ~1 PR, ~400-700 lines (mostly tests) |
| 3 | `HARDEN-H2-CONSOLE` | Disable H2 console outside `dev`; introduce `WALLET_KEK` env var + `Aes256GcmKeyStore`; add Flyway and the first migration (`V1__baseline.sql` capturing today's `ddl-auto: update` schema). | 2 | Medium | ~1 PR, ~600 lines (security + migration) |
| 4 | `REFACTOR-CRYPTO-PROVIDER` | Introduce `CryptoProvider`, `BitcoinCryptoProvider`, `TronCryptoProvider`, `CryptoProviderRegistry`. `WalletService` / `TransactionService` switch to the interface. `BitcoinWalletService` / `TronWalletService` are deleted at the end of this PR (their bodies moved into the providers). | 2, 3 | Medium-high | ~1 PR, ~900 lines (most lines moved, not new) |
| 5 | `REFACTOR-AUTH-MODEL` | Collapse `Admin` entity/repo/service into `User` + `Role`. New `auth.*` package, JWT, single `SecurityFilterChain`. Migration `V2__merge_admin_into_user.sql` (see `data-model.md`). Delete `AdminController` auth endpoints; admin feature endpoints move to `web.controller.admin.*`. | 3, 4 | High | 2-3 PRs (DB migration, code, frontend follow-up), each ~400-600 lines |
| 6 | `REFACTOR-TX-STATE-MACHINE` | Introduce `TxState`, `TxEvent`, `TxStateMachine`, `TxStateMachineService`. Rewrite `TransactionService.send` and the confirmation polling job in terms of events. Add `audit_log` table + `AuditLogger` calls on every state transition. | 4, 5 | Medium | ~1 PR, ~700 lines |
| 7 | `MERGE-DUAL-SPAS` | One `index.html`, one `main.tsx`, one router with `<RequireAuth>` and `<RequireRole role="ADMIN">`. Delete `AdminApp.tsx`, `admin.tsx`, `admin.html`. Keep CRA build for now. | 5 (so `/api/admin/*` already speaks the new role contract) | Medium | ~1 PR, ~500 lines (mostly file moves and route table) |
| 8 | `TYPED-API-HOOKS` | Single `lib/api.ts` Axios instance; per-resource typed hooks; delete `services/api.ts` and `services/adminApi.ts`. | 7 | Low | ~1 PR, ~400 lines |
| 9 | `UPGRADE-TS-TYPES` | TS 5.x; align `@types/*`; drop `@types/axios`; turn on `strict` + `noUncheckedIndexedAccess`; fix every type error introduced. | 8 | Low-medium | ~1 PR, ~200 lines + many small type-fix diffs |
| 10 | `MIGRATE-OFF-CRA` *(optional)* | CRA → Vite 5. Renames, env-var swap, scripts, Dockerfile build stage, CI. | 9 | Medium | ~1 PR, ~300 lines + Dockerfile edits |

Each numbered row is intended as one PR (or one PR cluster, where the row says
so explicitly). PRs that touch the database also include the Flyway migration
file in the same PR — never a separate "schema-only" PR.

### Branch / merge cadence

- Trunk-based. Each ticket → short-lived branch → squash-merge into `main`.
- Each PR must keep `mvn verify` and `npm run build` green; the CI added in
  ticket 2 enforces this.
- Each PR must be deployable on its own. No multi-PR refactors that break
  master between merges.

---

## 8. Out of scope

Listed explicitly so the tickets can refuse scope creep at review time:

- **No UI redesign.** The user wrote "NO UI" in the intake. Visual styles
  and DOM structure stay byte-identical. We only reorganise the React tree.
  No shadcn/ui, no Tailwind, no new design system — that would be its own
  project.
- **No migration off Spring Boot.** Java 21 + Spring Boot 3.2 is fine. We
  are not evaluating Quarkus, Micronaut, Ktor, or Go.
- **No new chains.** BTC and Tron/USDT only. The `CryptoProvider` interface
  *enables* future chains, but adding ETH / Solana / etc. is a separate
  product decision and a separate sprint.
- **No business-logic changes.** No new fee structures, no new transaction
  types, no admin-policy changes. Every endpoint's request/response shape
  is preserved (DTOs may be renamed; the JSON wire format does not change).
- **No NoSQL / event-bus introduction.** Audit log is a Postgres table, not
  Kafka, not Mongo. Adding an event bus is a future architectural step and
  out of scope for "refactor".
- **No live KMS integration.** `PrivateKeyStore` is designed to allow
  swap-in of `AwsKmsKeyStore` / `VaultTransitKeyStore`, but the only
  implementation that ships in this sprint is the local `Aes256GcmKeyStore`.
- **No history rewrite of the git repo** (`BFG` / `filter-repo`). `REPO-CLEAN`
  stops tracking the artefacts; purging history needs the team's explicit
  call because it forces every clone to re-fork.

---

## 9. Open questions parked for development phase

Carrying these forward so they don't get lost between phases. None of them
block architecture sign-off:

1. Confirmation strategy for `BROADCAST → CONFIRMED`: BTC needs N
   confirmations (default 3 on testnet, 6 on mainnet); Tron is single-block
   final-ish but we'll keep a 19-block (~57s) safety margin. Final values
   live in `application.yml` under `crypto.confirmations.{btc,tron}`.
2. JWT secret rotation: in-scope is the env var `JWT_SECRET`; rotation is
   manual (deploy a new value, force re-login). A rotating-key registry is
   future work.
3. Refresh-token storage: in-memory in v1 (refresh hits `/api/auth/refresh`
   while access token still in localStorage). If a logout-everywhere flow
   is needed later, we add a `refresh_tokens` table. Not in this sprint.
4. Admin bootstrap: first `ADMIN` user is provisioned via a one-off
   migration `V3__seed_initial_admin.sql` that takes the email from
   `ADMIN_BOOTSTRAP_EMAIL` env var and a temporary password from
   `ADMIN_BOOTSTRAP_PASSWORD` (forces password change on first login).
   Defined here so the dev-phase ticket doesn't reinvent it.

---

End of architecture document.
