package com.cryptowallet.service.crypto;

import lombok.Data;

@Data
public class KeyPair {
    private String address;
    private String privateKey;
}
