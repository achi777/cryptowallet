# Data migrations

We do not currently use Flyway or Liquibase. Hibernate `ddl-auto: update` handles
schema deltas at boot, and one-shot data migrations live in dedicated
`@PostConstruct` runners under `com.cryptowallet.config`. This is a deliberate
choice — at the project's current size, a heavyweight migration tool would be
more ceremony than the deltas warrant; a follow-up ticket will reassess once
production scale or multi-environment branching makes the tradeoff swing.

## CRYPTOWALL-5 — admins → users (role-based identity)

`DataMigrationRunner` collapses the legacy `admins` table into `users` with
`role='ADMIN'`. On startup it checks for the `admins` table; when present, it
copies each row into `users` (deduplicating by `email`/`username` — pre-existing
matches are skipped with a warning, never overwritten) and then drops `admins`.
On fresh databases or already-migrated environments the runner is a no-op.
Verified under both H2 (in-memory profile) and Postgres.
