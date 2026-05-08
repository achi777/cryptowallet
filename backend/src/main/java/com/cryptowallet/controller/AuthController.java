package com.cryptowallet.controller;

import com.cryptowallet.dto.AuthResponseDto;
import com.cryptowallet.dto.UnifiedLoginDto;
import com.cryptowallet.dto.UserDto;
import com.cryptowallet.dto.UserRegistrationDto;
import com.cryptowallet.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

/**
 * Unified, role-aware sign-in endpoint backing the canonical {@code /signin} page.
 *
 * <p>Accepts {@code email + password}, returns the authenticated {@link UserDto} (which
 * carries the role) on success. Frontend reads {@code user.role} to decide where to
 * redirect — no separate admin endpoint required for this entry point. The legacy
 * username-based {@code /api/admin/login} endpoint was retired in CRYPTOWALL-18; it now
 * returns {@code 410 Gone}. The legacy {@code /api/users/login} endpoint is kept for
 * backward compatibility with non-browser API clients.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    private final UserService userService;

    @PostMapping("/signin")
    public ResponseEntity<AuthResponseDto> signIn(@Valid @RequestBody UnifiedLoginDto loginDto) {
        Optional<UserDto> userOpt = userService.authenticateByEmail(loginDto.getEmail(), loginDto.getPassword());

        AuthResponseDto response = new AuthResponseDto();
        if (userOpt.isPresent()) {
            response.setMessage("Sign-in successful");
            response.setSuccess(true);
            response.setUser(userOpt.get());
            return ResponseEntity.ok(response);
        }

        response.setMessage("Invalid email or password");
        response.setSuccess(false);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    /**
     * Self-serve user registration (CRYPTOWALL-20). Delegates to the same
     * {@link UserService#registerUser} path used by the legacy
     * {@code /api/users/register} endpoint, which is retained for back-compat.
     * Always provisions a {@code USER}-role account; the optional {@code role}
     * field on {@link UserRegistrationDto} is ignored here so this endpoint
     * cannot be used to escalate to ADMIN.
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponseDto> register(@Valid @RequestBody UserRegistrationDto registrationDto) {
        AuthResponseDto response = new AuthResponseDto();
        try {
            UserDto user = userService.registerUser(registrationDto);
            response.setMessage("User registered successfully");
            response.setUser(user);
            response.setSuccess(true);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            response.setMessage(e.getMessage());
            response.setUser(null);
            response.setSuccess(false);
            return ResponseEntity.badRequest().body(response);
        }
    }
}
