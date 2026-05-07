package com.cryptowallet.service;

import com.cryptowallet.entity.Transaction;
import com.cryptowallet.entity.Transaction.TransactionStatus;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

class TransactionStateMachineTest {

    private final TransactionStateMachine stateMachine = new TransactionStateMachine();

    private Transaction tx(TransactionStatus status) {
        return Transaction.builder().status(status).build();
    }

    private Transaction txWithId(TransactionStatus status) {
        Transaction t = Transaction.builder().status(status).build();
        t.setId(1L);
        return t;
    }

    // --- legal transitions ---

    @Test
    void pendingToBroadcastAllowed() {
        Transaction t = tx(TransactionStatus.PENDING);
        stateMachine.transition(t, TransactionStatus.BROADCAST);
        assertThat(t.getStatus()).isEqualTo(TransactionStatus.BROADCAST);
    }

    @Test
    void pendingToFailedAllowed() {
        Transaction t = tx(TransactionStatus.PENDING);
        stateMachine.transition(t, TransactionStatus.FAILED);
        assertThat(t.getStatus()).isEqualTo(TransactionStatus.FAILED);
    }

    @Test
    void broadcastToConfirmedAllowed() {
        Transaction t = tx(TransactionStatus.BROADCAST);
        stateMachine.transition(t, TransactionStatus.CONFIRMED);
        assertThat(t.getStatus()).isEqualTo(TransactionStatus.CONFIRMED);
    }

    @Test
    void broadcastToFailedAllowed() {
        Transaction t = tx(TransactionStatus.BROADCAST);
        stateMachine.transition(t, TransactionStatus.FAILED);
        assertThat(t.getStatus()).isEqualTo(TransactionStatus.FAILED);
    }

    // --- illegal transitions ---

    @Test
    void pendingToConfirmedRejected() {
        assertThatThrownBy(() -> stateMachine.transition(tx(TransactionStatus.PENDING), TransactionStatus.CONFIRMED))
                .isInstanceOf(IllegalTransactionStateException.class)
                .hasMessageContaining("PENDING -> CONFIRMED");
    }

    @Test
    void pendingToPendingRejected() {
        assertThatThrownBy(() -> stateMachine.transition(tx(TransactionStatus.PENDING), TransactionStatus.PENDING))
                .isInstanceOf(IllegalTransactionStateException.class)
                .hasMessageContaining("PENDING -> PENDING");
    }

    @Test
    void broadcastToPendingRejected() {
        assertThatThrownBy(() -> stateMachine.transition(tx(TransactionStatus.BROADCAST), TransactionStatus.PENDING))
                .isInstanceOf(IllegalTransactionStateException.class)
                .hasMessageContaining("BROADCAST -> PENDING");
    }

    @Test
    void broadcastToBroadcastRejected() {
        assertThatThrownBy(() -> stateMachine.transition(tx(TransactionStatus.BROADCAST), TransactionStatus.BROADCAST))
                .isInstanceOf(IllegalTransactionStateException.class)
                .hasMessageContaining("BROADCAST -> BROADCAST");
    }

    @Test
    void confirmedTerminal() {
        for (TransactionStatus next : TransactionStatus.values()) {
            assertThatThrownBy(() -> stateMachine.transition(tx(TransactionStatus.CONFIRMED), next))
                    .as("CONFIRMED -> %s", next)
                    .isInstanceOf(IllegalTransactionStateException.class)
                    .hasMessageContaining("CONFIRMED -> " + next);
        }
    }

    @Test
    void failedTerminal() {
        for (TransactionStatus next : TransactionStatus.values()) {
            assertThatThrownBy(() -> stateMachine.transition(tx(TransactionStatus.FAILED), next))
                    .as("FAILED -> %s", next)
                    .isInstanceOf(IllegalTransactionStateException.class)
                    .hasMessageContaining("FAILED -> " + next);
        }
    }

    @Test
    void nullTargetRejected() {
        assertThatThrownBy(() -> stateMachine.transition(tx(TransactionStatus.PENDING), null))
                .isInstanceOf(IllegalTransactionStateException.class)
                .hasMessageContaining("Target status must not be null");
    }

    @Test
    void nullCurrentStatusRejected() {
        Transaction t = Transaction.builder().build();
        assertThatThrownBy(() -> stateMachine.transition(t, TransactionStatus.PENDING))
                .isInstanceOf(IllegalTransactionStateException.class)
                .hasMessageContaining("null status");
    }

    // --- assertValidPersist ---

    @Test
    void assertValidPersistAllowsPendingOnInsert() {
        assertDoesNotThrow(() -> TransactionStateMachine.assertValidPersist(tx(TransactionStatus.PENDING)));
    }

    @Test
    void assertValidPersistAllowsConfirmedOnInsert() {
        assertDoesNotThrow(() -> TransactionStateMachine.assertValidPersist(tx(TransactionStatus.CONFIRMED)));
    }

    @Test
    void assertValidPersistAllowsBroadcastOnUpdate() {
        assertDoesNotThrow(() -> TransactionStateMachine.assertValidPersist(txWithId(TransactionStatus.BROADCAST)));
    }

    @Test
    void assertValidPersistAllowsFailedOnUpdate() {
        assertDoesNotThrow(() -> TransactionStateMachine.assertValidPersist(txWithId(TransactionStatus.FAILED)));
    }

    @Test
    void assertValidPersistRejectsNullStatus() {
        Transaction t = Transaction.builder().build();
        assertThatThrownBy(() -> TransactionStateMachine.assertValidPersist(t))
                .isInstanceOf(IllegalTransactionStateException.class)
                .hasMessageContaining("must not be null");
    }

    @Test
    void assertValidPersistRejectsBroadcastOnInsert() {
        assertThatThrownBy(() -> TransactionStateMachine.assertValidPersist(tx(TransactionStatus.BROADCAST)))
                .isInstanceOf(IllegalTransactionStateException.class)
                .hasMessageContaining("BROADCAST");
    }

    @Test
    void assertValidPersistRejectsFailedOnInsert() {
        assertThatThrownBy(() -> TransactionStateMachine.assertValidPersist(tx(TransactionStatus.FAILED)))
                .isInstanceOf(IllegalTransactionStateException.class)
                .hasMessageContaining("FAILED");
    }
}
