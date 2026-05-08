package com.cryptowallet.service;

import com.cryptowallet.entity.Transaction;
import com.cryptowallet.entity.Transaction.TransactionStatus;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * Validates and applies status transitions on Transaction entities.
 * Treats CONFIRMED and FAILED as terminal states.
 */
@Component
public class TransactionStateMachine {

    private static final Map<TransactionStatus, Set<TransactionStatus>> LEGAL =
            new EnumMap<>(TransactionStatus.class);

    static {
        LEGAL.put(TransactionStatus.PENDING,   EnumSet.of(TransactionStatus.BROADCAST, TransactionStatus.FAILED));
        LEGAL.put(TransactionStatus.BROADCAST, EnumSet.of(TransactionStatus.CONFIRMED, TransactionStatus.FAILED));
        LEGAL.put(TransactionStatus.CONFIRMED, EnumSet.noneOf(TransactionStatus.class));
        LEGAL.put(TransactionStatus.FAILED,    EnumSet.noneOf(TransactionStatus.class));
    }

    /** Initial states allowed on a fresh transaction. */
    private static final Set<TransactionStatus> ALLOWED_INITIAL =
            EnumSet.of(TransactionStatus.PENDING, TransactionStatus.CONFIRMED);

    /**
     * Apply an explicit transition. Mutates {@code tx} on success, throws
     * {@link IllegalTransactionStateException} on illegal input.
     */
    public void transition(Transaction tx, TransactionStatus next) {
        TransactionStatus current = tx.getStatus();
        if (current == null) {
            throw new IllegalTransactionStateException(
                "Cannot transition transaction with null status; use a builder for the initial state");
        }
        if (next == null) {
            throw new IllegalTransactionStateException("Target status must not be null");
        }
        Set<TransactionStatus> allowed = LEGAL.getOrDefault(current, EnumSet.noneOf(TransactionStatus.class));
        if (!allowed.contains(next)) {
            throw new IllegalTransactionStateException(
                "Illegal transition: " + current + " -> " + next + " (terminal or not permitted)");
        }
        tx.setStatus(next);
    }

    /**
     * Called from {@code @PrePersist}/{@code @PreUpdate}. Static so it can be
     * invoked from the JPA entity lifecycle without a Spring context.
     * Only checks shape/isolation invariants; full transition validation runs
     * in {@link #transition}.
     */
    public static void assertValidPersist(Transaction tx) {
        if (tx.getStatus() == null) {
            throw new IllegalTransactionStateException("Transaction.status must not be null");
        }
        // Insert-time only: only PENDING or CONFIRMED are valid initial states.
        // Hibernate sets id after insert, so id == null reliably identifies an insert.
        if (tx.getId() == null && !ALLOWED_INITIAL.contains(tx.getStatus())) {
            throw new IllegalTransactionStateException(
                "Transaction cannot be created in state " + tx.getStatus()
                + "; allowed initial states are " + ALLOWED_INITIAL);
        }
    }
}
