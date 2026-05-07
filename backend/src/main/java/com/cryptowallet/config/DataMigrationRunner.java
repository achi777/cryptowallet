package com.cryptowallet.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * One-time migration: collapse legacy {@code admins} rows into {@code users} with
 * {@code role='ADMIN'}. Runs on startup; no-op when the legacy table doesn't exist
 * (fresh DB or already-migrated environments). See {@code docs/architecture/MIGRATIONS.md}.
 *
 * <p>Uses {@link JdbcTemplate} directly to avoid JPA caching issues with a table that's
 * being dropped. Tested under both H2 (in-memory) and Postgres.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataMigrationRunner {

    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void migrateAdminsIntoUsers() {
        if (!legacyAdminsTableExists()) {
            log.info("DataMigrationRunner: no 'admins' table — skipping admin → user migration.");
            return;
        }

        List<Map<String, Object>> rows;
        try {
            rows = jdbcTemplate.queryForList("SELECT * FROM admins");
        } catch (Exception e) {
            log.warn("DataMigrationRunner: could not read 'admins' table ({}); skipping.", e.getMessage());
            return;
        }

        int copied = 0;
        int skipped = 0;
        for (Map<String, Object> row : rows) {
            String email = stringOf(row.get("email"));
            String username = stringOf(row.get("username"));
            if (email == null || username == null) {
                skipped++;
                continue;
            }

            Long existing = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM users WHERE email = ? OR username = ?",
                    Long.class, email, username);
            if (existing != null && existing > 0) {
                log.warn("DataMigrationRunner: user with email={} or username={} already exists — skipping admin row.",
                        email, username);
                skipped++;
                continue;
            }

            jdbcTemplate.update(
                    "INSERT INTO users (username, email, password, first_name, last_name, role, active, last_login, created_at, updated_at) " +
                            "VALUES (?, ?, ?, ?, ?, 'ADMIN', ?, ?, COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP))",
                    username,
                    email,
                    stringOf(row.get("password")),
                    stringOf(row.get("first_name")),
                    stringOf(row.get("last_name")),
                    row.get("active") == null ? Boolean.TRUE : row.get("active"),
                    row.get("last_login"),
                    row.get("created_at"),
                    row.get("updated_at"));
            copied++;
        }

        try {
            jdbcTemplate.execute("DROP TABLE admins");
            log.info("DataMigrationRunner: migrated {} admin row(s), skipped {} duplicate(s); 'admins' table dropped.",
                    copied, skipped);
        } catch (Exception e) {
            log.warn("DataMigrationRunner: could not drop 'admins' table ({}); leaving in place.", e.getMessage());
        }
    }

    private boolean legacyAdminsTableExists() {
        try {
            jdbcTemplate.queryForObject("SELECT 1 FROM admins LIMIT 1", Integer.class);
            return true;
        } catch (org.springframework.dao.EmptyResultDataAccessException emptyTable) {
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private static String stringOf(Object o) {
        return o == null ? null : o.toString();
    }
}
