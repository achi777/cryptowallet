package com.cryptowallet.dto;

import com.cryptowallet.entity.Admin;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AdminDto {
    private Long id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private Admin.AdminRole role;
    private Boolean active;
    private LocalDateTime lastLogin;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}