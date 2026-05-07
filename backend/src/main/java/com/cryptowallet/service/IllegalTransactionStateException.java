package com.cryptowallet.service;

public class IllegalTransactionStateException extends RuntimeException {

    public IllegalTransactionStateException(String message) {
        super(message);
    }
}
