# CryptoWallet — Target Data Model (post-refactor)

Persistence engine: **PostgreSQL 15** (already used in prod via Docker
Compose). Schema is owned by **Flyway** after `HARDEN-H2-CONSOLE`. Today
the project has *no* migration tool — Hibernate runs with `ddl-auto:
update`. This document describes the post-refactor schema and the forward
migrations that get us there.

All identifiers are `UUID` (Postgres `uuid` type, generated server-side via
`gen_random_uuid()` from `pgcrypto`). All timestamps are `TIMESTAMPTZ`,
stored in UTC. Money is `NUMERIC(38, 18)` so we can hold satoshis (BTC,
8 decimals) and TRC-20 amounts (USDT uses 6) without loss; the `Money`
domain type asserts the right scale per chain at the application layer.

---

## Tables

### `users`

Single source of identity for both customers and support staff. Replaces
the current pair (`User` + `Admin`).

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `email` | `varchar(254)` | NOT NULL, **UNIQUE** (citext semantics via `LOWER(email)` index) | RFC 5321 max length |
| `password_hash` | `varchar(60)` | NOT NULL | BCrypt hash, fixed length 60 |
| `role` | `varchar(16)` | NOT NULL, CHECK (`role IN ('CUSTOMER','ADMIN')`) | Backed by `domain.Role` enum |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | Bumped via JPA `@PreUpdate` |

Indexes:
- `users_email_lower_uq` — `UNIQUE (LOWER(email))` so login-by-email is
  case-insensitive but the stored value preserves the user's input.
- `users_role_idx` — `(role)` (low-cardinality, but cheap and used by
  admin-list views).

**Why it differs from current schema.** The current code has a `users`
table for customers and a separate `admins` table with the same shape plus
some "admin" flags. After the refactor there is one table; `role` is the
discriminator. This eliminates four parallel classes (entity, repository,
service, controller) and removes the drift risk between them.

**Migration:** see `V2__merge_admin_into_user.sql` below.

### `wallets`

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `user_id` | `uuid` | NOT NULL, FK → `users(id)` ON DELETE RESTRICT | One user, many wallets |
| `chain` | `varchar(8)` | NOT NULL, CHECK (`chain IN ('BTC','TRON')`) | Backed by `domain.Chain` enum |
| `public_address` | `varchar(64)` | NOT NULL | BTC bech32 ≤ 62, Tron base58 = 34 |
| `encrypted_private_key` | `bytea` | NOT NULL | `version(1B) ‖ iv(12B) ‖ ciphertext+gcm_tag` (see ARCHITECTURE.md §6) |
| `label` | `varchar(64)` | NULL | User-supplied display name |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | |

Indexes:
- `wallets_user_id_idx` — `(user_id)` for the wallet-list-by-owner query.
- `wallets_address_uq` — `UNIQUE (chain, public_address)` so the same
  on-chain address can't be associated with two wallets.

**Why it differs from current schema.** Today the wallet stores its
private key in (effectively) the clear and there is no per-record IV. The
post-refactor schema replaces `private_key VARCHAR` with
`encrypted_private_key BYTEA` and forbids NULL. The migration
(`V3__encrypt_private_keys.sql`) re-wraps existing rows: read the plain
key, encrypt with the active KEK, write back, drop the old column in a
follow-up migration once a deploy has confirmed all rows are migrated.

### `transactions`

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `wallet_id` | `uuid` | NOT NULL, FK → `wallets(id)` ON DELETE RESTRICT | |
| `chain` | `varchar(8)` | NOT NULL, CHECK (`chain IN ('BTC','TRON')`) | Denormalised from `wallets.chain` for cheap admin queries |
| `direction` | `varchar(4)` | NOT NULL, CHECK (`direction IN ('IN','OUT')`) | |
| `state` | `varchar(16)` | NOT NULL, CHECK (`state IN ('PENDING','BROADCAST','CONFIRMED','FAILED')`) | Driven by `TxStateMachine` |
| `amount` | `numeric(38, 18)` | NOT NULL, CHECK (`amount > 0`) | Chain-native units; `Money` enforces scale |
| `tx_hash` | `varchar(128)` | NULL until BROADCAST | Unique within `chain` once set |
| `counterparty_address` | `varchar(64)` | NOT NULL | Destination for OUT, source for IN |
| `error_message` | `varchar(512)` | NULL | Populated when `state = FAILED` |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | |

Indexes:
- `tx_wallet_id_created_idx` — `(wallet_id, created_at DESC)` for the
  per-wallet history view.
- `tx_state_idx` — `(state)` (partial: `WHERE state IN ('PENDING','BROADCAST')`)
  — drives the polling jobs `TxBroadcastJob` and `TxConfirmJob`.
- `tx_hash_uq` — `UNIQUE (chain, tx_hash) WHERE tx_hash IS NOT NULL`
  prevents double-recording the same on-chain tx.

**Why it differs from current schema.** Today `state` is an ad-hoc string
("sent", "pending", "ok") set in three different services; the
constraint is informal. The post-refactor schema makes the four-state
machine a CHECK constraint and makes `tx_hash` uniqueness a real index
instead of "we hope". The `error_message` column is new — currently a
failure leaves no audit trail beyond the application log.

### `audit_log`

New table introduced in `REFACTOR-TX-STATE-MACHINE`. Every state
transition and every administrative mutation writes a row.

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `actor_user_id` | `uuid` | FK → `users(id)` ON DELETE SET NULL | NULL for system-driven events (scheduled jobs) |
| `action` | `varchar(64)` | NOT NULL | e.g. `TX_BROADCAST_OK`, `USER_LOGIN`, `ADMIN_RESET_PASSWORD` |
| `target_type` | `varchar(32)` | NOT NULL | e.g. `transaction`, `user`, `wallet` |
| `target_id` | `uuid` | NULL | NULL for actions that don't target an entity (e.g. failed-login) |
| `payload` | `jsonb` | NOT NULL, default `'{}'::jsonb` | Free-form context (old/new state, ip, user-agent, …) |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |

Indexes:
- `audit_actor_idx` — `(actor_user_id, created_at DESC)`
- `audit_target_idx` — `(target_type, target_id, created_at DESC)`
- `audit_action_idx` — `(action, created_at DESC)`

**Retention.** Out of scope for the refactor; the table grows until ops
sets a retention policy. Architecture choice deliberately picks
`jsonb` payloads so log entries don't fork the schema for every new
event.

---

## Migration strategy

### Tooling

Introduce **Flyway 10.x** in the `HARDEN-H2-CONSOLE` ticket (it sits
before the migrations that actually move data). Reasons:

1. The project does not currently use Liquibase; Flyway's plain `*.sql`
   files keep the diff readable on PRs.
2. Spring Boot 3.2 has first-class auto-config for Flyway via
   `spring-boot-starter`. No separate runner needed.
3. Flyway clean is disabled in `prod`/`staging` profiles (default in
   Flyway 10).

`spring.jpa.hibernate.ddl-auto` is changed from `update` to `validate` in
the same PR — Hibernate stops writing schema; it only checks the schema
matches the entities at boot.

### File naming

`src/main/resources/db/migration/Vxx__description.sql`. Forward-only.
Version numbers are monotonic per ticket; gaps are forbidden.

### Forward migration order

| Version | Filename | Owning ticket | Purpose |
| ------- | -------- | ------------- | ------- |
| `V1` | `V1__baseline.sql` | `HARDEN-H2-CONSOLE` | Capture today's `ddl-auto: update` schema verbatim. Hand-written from a `pg_dump --schema-only` against a freshly-booted dev environment so devs upgrading from old branches don't see drift. |
| `V2` | `V2__merge_admin_into_user.sql` | `REFACTOR-AUTH-MODEL` | Add `role` column to `users` (default `'CUSTOMER'`); copy each `admins` row into `users` with `role='ADMIN'` (skip if email already exists, log a `WARNING` row in audit log); update FK references; drop `admins` table at the end of the migration. |
| `V3` | `V3__encrypt_private_keys.sql` | `HARDEN-H2-CONSOLE` (data part) | Add `encrypted_private_key BYTEA` column. Run a one-shot `DO $$ … $$` block that re-wraps each row's plaintext private key using `pgcrypto`'s `pgp_sym_encrypt` keyed off `current_setting('app.kek')` (set per-deploy by the migration runner). NOT NULL constraint added at the end. The plain `private_key` column is dropped in `V4`. |
| `V4` | `V4__drop_plain_private_key.sql` | `HARDEN-H2-CONSOLE` (cleanup, deployed in a *follow-up* release) | `ALTER TABLE wallets DROP COLUMN private_key`. Kept as a separate migration so a single deploy can be rolled back without losing the new encrypted column. |
| `V5` | `V5__transaction_state_constraints.sql` | `REFACTOR-TX-STATE-MACHINE` | Normalise existing `state` strings to the four-state vocabulary (`'sent' → 'BROADCAST'`, `'ok' → 'CONFIRMED'`, etc.). Add the `CHECK` constraint. Add `error_message`, `tx_hash` UNIQUE partial index. |
| `V6` | `V6__audit_log.sql` | `REFACTOR-TX-STATE-MACHINE` | Create `audit_log` table and indexes. |
| `V7` | `V7__seed_initial_admin.sql` | `REFACTOR-AUTH-MODEL` | Idempotent insert of an `ADMIN` user keyed off `ADMIN_BOOTSTRAP_EMAIL`. No-op if the row already exists. |

### Rollback plan

Flyway is forward-only. We do not author "down" migrations because they
are unsafe with concurrent writes and rarely rehearsed. Instead:

1. **Pre-deploy backup.** Every migration that drops a column or
   constraint is preceded by an automatic `pg_dump` in the deploy
   pipeline. Roll-forward fixes are written if a migration produces bad
   data; the dump is the disaster recovery for everything else.
2. **Two-step destructive changes.** When we drop a column we do it in a
   *later* migration than the one that introduced its replacement (see
   `V3` adding `encrypted_private_key`, `V4` dropping `private_key` one
   release later). This means rolling the application back one release
   does not strand the database in a state the older code can't read.
3. **Big-bang migrations are forbidden.** No migration touches more than
   one logical change. If a migration would, it gets split.
4. **Migration tests.** A new test class `FlywayMigrationTest` in
   `src/test/java` boots an empty Postgres via Testcontainers, runs all
   migrations, and asserts the schema matches the JPA entities
   (Hibernate's `validate` mode). Runs in CI on every PR.

### What happens in dev

`application-dev.yml` keeps H2 for the fast inner loop. Flyway runs
against H2 too, using the same `*.sql` files (kept in PostgreSQL-flavoured
syntax that H2's `MODE=PostgreSQL` accepts). When a migration uses
Postgres-only features (`gen_random_uuid()`, `jsonb`, `pgcrypto`), the H2
profile sets up shims — or, for migrations the team flags as
"Postgres-only", the dev profile is bumped to a Testcontainers Postgres
instead. Decision recorded here, executed in `HARDEN-H2-CONSOLE`.

---

End of data-model document.
