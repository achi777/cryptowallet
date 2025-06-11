package com.cryptowallet.dto;

import lombok.Data;

@Data
public class AuthResponseDto {
    private String message;
    private UserDto user;
    private boolean success;
    
    public AuthResponseDto(String message, UserDto user, boolean success) {
        this.message = message;
        this.user = user;
        this.success = success;
    }
}