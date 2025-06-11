package com.cryptowallet.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class UserDto {
    private Long id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private Boolean active;
    private List<WalletDto> wallets;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}