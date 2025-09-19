package com.cryptowallet.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class AuthResponseDto {
    private String message;
    private UserDto user;
    private AdminDto admin;
    private boolean success;
    
    public AuthResponseDto(String message, UserDto user, boolean success) {
        this.message = message;
        this.user = user;
        this.success = success;
    }
    
    public AuthResponseDto(String message, AdminDto admin, boolean success) {
        this.message = message;
        this.admin = admin;
        this.success = success;
    }
}