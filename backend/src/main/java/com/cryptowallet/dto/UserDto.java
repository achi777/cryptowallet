package com.cryptowallet.dto;

import com.cryptowallet.entity.User;
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
    private User.Role role;
    private Boolean active;
    private LocalDateTime lastLogin;
    private List<WalletDto> wallets;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
