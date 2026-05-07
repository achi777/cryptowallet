# SECURITY — at-rest encryption + secret hygiene

Status: living doc. Companion to `ARCHITECTURE.md` and `data-model.md`.
Ticket: CRYPTOWALL-3 (ARCH-SEC).

## 1. Audit findings

Snapshot of plaintext-secret exposure in the working tree at the start of CRYPTOWALL-3,
and the action taken in this PR.

| # | Finding | Location (pre-PR) | Resolution in this PR |
|---|---------|-------------------|------------------------|
| 1 | Wallet signing keys stored as plaintext in `wallets.private_key` | `backend/.../entity/Wallet.java:32` | Encrypted-at-rest via `EncryptedStringConverter` (AES-256-GCM, app-DEK derived from KEK). Column widened to 1024 chars. |
| 2 | DB password literal in app config (`crypto123`) | `backend/.../resources/application.yml:9` | Replaced with `${SPRING_DATASOURCE_PASSWORD:}`. |
| 3 | DB password default literal in prod config (`crypto123`) | `backend/.../resources/application-prod.yml:12` | Default removed; empty fallback so absence is visible and fails the auth. |
| 4 | DB role password literal in init SQL (`crypto123`) | `database/init/01-init.sql:9` | Replaced with `current_setting('cryptowallet.cryptouser_password')`-driven `EXECUTE format(...)`. |
| 5 | Public bcrypt-hashed admin password seeded (`admin123`) | `database/init/01-init.sql:31` | INSERT removed. Bootstrap moved to `AdminService` first-boot path using `ADMIN_BOOTSTRAP_PASSWORD`. |
| 6 | DB password literal in prod compose overlay (`crypto123`) | `docker-compose.prod.yml:12` | `${SPRING_DATASOURCE_PASSWORD:?...}` — compose now refuses to start without it. |
| 7 | Postgres superuser literal (`POSTGRES_PASSWORD: postgres`) | `docker-compose.prod.yml:23` | `${POSTGRES_PASSWORD:?...}`. |
| 8 | No master KEK plumbed in any profile | (absent) | New `CRYPTOWALL_KEK_BASE64` env / `app.security.kek` — required in prod, dev-fallback in staging/h2. |
| 9 | No per-user data-key | (absent) | `users.wrapped_dek` column added; generated on registration; wrapped with KEK. |
| 10 | No `.env.example` template | (absent) | Added at repo root (gitignored real `.env`). |
| 11 | Tron API key path was already env-driven | `application*.yml` (`${TRON_PRIVATE_KEY:}`) | No change needed. |

### Git history scan (out-of-PR scope)

`git log --all -p -S 'PRIVATE KEY'` returns no matches — no PEM blocks were ever
committed. The plaintext DB passwords (`crypto123`, `postgres`) are still present
in commits prior to this PR. **History rewriting is intentionally out of scope
for this PR**: it would force-push a shared branch and disrupt contributors.
Tracked as follow-up:

- Rotate the leaked DB passwords (any deploy that ever used `crypto123` must change it).
- Decide whether to do a coordinated `git filter-repo` pass or leave the audit trail intact and rely on rotation.

## 2. Key derivation chain

```
                 CRYPTOWALL_KEK_BASE64    (32 raw bytes, base64; secret manager / env)
                            │
                            ▼
                          KEK            (AES-256, in-memory only)
                       ┌────┴────┐
                       │         │
                       ▼         ▼
                appDEK        per-user DEK
       (SHA-256 domain-       (random 32 bytes,
        separated derivation;  wrapped with KEK,
        used by JPA converter) stored in users.wrapped_dek)
                       │              │
                       ▼              ▼
              wallet.private_key   future per-user
              (AES-256-GCM,        encrypted columns
              IV per row)          (notes, mnemonics, …)
```

Per-record payload = `base64url( IV(12) || ciphertext || tag(16) )`.
IV is sampled fresh from `SecureRandom` for every encrypt — never reused under a given key.
GCM tag is 128 bits.

### Why two DEKs?

- **`appDEK`** — used by `EncryptedStringConverter`. JPA converters are column-scoped and
  don't have row context at fetch time, so a single deterministic-from-KEK app key avoids the
  chicken-and-egg problem of needing the user's DEK before the row is materialised.
- **per-user DEK** (`users.wrapped_dek`) — provisioned at registration, available to service
  code that already has the `User` aggregate in hand. Used today as defense-in-depth /
  rotation prep; future per-user fields (mnemonics, encrypted notes) call
  `cryptoService.encryptWithDek(unwrap(user.getWrappedDek()), …)` directly.

This split is documented so the two-tier design isn't mistaken for an oversight.

## 3. KEK rotation

KEK rotation is a one-shot offline procedure today (no automation). High-level steps:

1. Generate the new KEK: `openssl rand -base64 32`.
2. Deploy a transient *dual-KEK* build that accepts both `CRYPTOWALL_KEK_BASE64` (new)
   and `CRYPTOWALL_KEK_BASE64_OLD` (old). (Not yet in code; see Future Work.)
3. Run a backfill job that, for each `User`:
   - Unwraps the existing `wrapped_dek` with `OLD`.
   - Re-wraps with `NEW`.
   - Writes the new payload back.
4. Re-encrypt every encrypted-at-rest column (e.g. `wallets.private_key`) under the
   new `appDEK` derivation. This requires a coordinated read-old-write-new pass —
   schedule under maintenance window.
5. Once 100% of rows are migrated, remove `CRYPTOWALL_KEK_BASE64_OLD` and redeploy.

Until step 5 completes, **destroying the old KEK destroys data**. Treat KEK like a
backup encryption key: keep both versions for a defined retention window.

## 4. Threat model

### What AES-256-GCM at-rest protects against

- **Database dump / backup theft** — an attacker who steals a `pg_dump` or volume snapshot
  cannot recover wallet private keys without the KEK. Plaintext is never written to the DB.
- **Read-only DB compromise** — a SQL injection that returns rows leaks ciphertext only.
- **Tampering** — GCM authenticates the ciphertext + IV. Bit-flips in the on-disk payload
  produce `AEADBadTagException` at decrypt; no silent corruption.

### What it does NOT protect against

- **Compromised running JVM** — once decrypted, plaintext lives in heap memory. A heap
  dump or attacker with code-exec on the running container reads the same plaintext
  the legitimate code path sees.
- **KEK exfiltration** — anyone who can read the `CRYPTOWALL_KEK_BASE64` env (compose file,
  k8s secret, /proc/<pid>/environ inside the container) can decrypt everything. KEK
  storage is the bottom of the trust ladder. Future: integrate AWS KMS / GCP KMS / Vault
  so the KEK never lives in process env.
- **Logical authorization bugs** — encryption doesn't stop a user/admin endpoint from
  returning someone else's wallet to the wrong caller. That's an authorization concern
  (see `SecurityConfig` — currently `permitAll`, tracked separately).
- **Side channels in `bcrypt`/`crypto-js`/etc.** — out of scope.
- **Pre-existing committed-secret history** — rotation, not encryption, is the answer.

## 5. Configuration surface

| Profile  | KEK behaviour                                                   |
|----------|------------------------------------------------------------------|
| `prod`   | `CRYPTOWALL_KEK_BASE64` (or `app.security.kek`) **required** — boot fails-fast otherwise. |
| `staging`| Optional. Missing value → deterministic SHA-256 dev-KEK + a loud `WARN`. Suitable for the single-image staging container; data does not survive a real KEK migration. |
| `h2`     | Same staging fallback semantics.                                 |

Source of truth: `backend/src/main/java/com/cryptowallet/security/CryptoService.java`.

## 6. Future work (NOT in this PR)

- History scrub (`git filter-repo`) for the leaked DB passwords.
- Wire `mnemonic` / API-secret columns through `EncryptedStringConverter` as they land.
- Switch from env-bound KEK to KMS-backed envelope encryption (AWS KMS / GCP KMS / Vault Transit).
- Per-user DEK enforcement on the converter via a Hibernate interceptor that resolves the
  owning `User` and pre-loads the DEK into a request-scoped holder.
- Automated KEK rotation tooling.
- Tighten `SecurityConfig` — currently `permitAll` end-to-end so the SPA can serve from
  the same origin; needs proper auth on `/api/**` (see CRYPTOWALL-13 follow-up scope).
