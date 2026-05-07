package com.cryptowallet.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UnifiedLoginDto {

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be a well-formed address")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;
}
