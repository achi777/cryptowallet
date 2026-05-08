package com.cryptowallet.controller;

import com.cryptowallet.dto.*;
import com.cryptowallet.entity.User;
import com.cryptowallet.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/**
 * Admin-side endpoints. Backed by a single {@link User} entity with {@link User.Role#ADMIN}.
 *
 * <p>SecurityConfig is currently {@code permitAll()}; role enforcement is performed in this
 * controller (login rejects non-admins; admin-creation paths force {@code role=ADMIN}). A
 * follow-up ticket will move these checks to {@code @PreAuthorize} once real auth is wired.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:3000")
public class AdminController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDto> registerAdmin(@Valid @RequestBody UserRegistrationDto registrationDto) {
        try {
            UserDto admin = userService.registerUserWithRole(registrationDto, User.Role.ADMIN);
            AuthResponseDto response = new AuthResponseDto();
            response.setMessage("Admin registered successfully");
            response.setSuccess(true);
            response.setUser(admin);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Admin registration failed: {}", e.getMessage());
            AuthResponseDto response = new AuthResponseDto();
            response.setMessage(e.getMessage());
            response.setSuccess(false);
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Legacy admin sign-in endpoint. Removed in CRYPTOWALL-18 in favour of the
     * unified {@code POST /api/auth/signin} which accepts an email and dispatches
     * by {@code role}. We return {@code 410 Gone} so any stale clients still
     * pointed here surface a clear error rather than silently 404-ing.
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> loginAdmin() {
        AuthResponseDto response = new AuthResponseDto();
        response.setMessage("Endpoint removed. Use POST /api/auth/signin with email + password.");
        response.setSuccess(false);
        return ResponseEntity.status(HttpStatus.GONE).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getAdminById(@PathVariable Long id) {
        return userService.findById(id)
                .filter(u -> u.getRole() == User.Role.ADMIN)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/username/{username}")
    public ResponseEntity<UserDto> getAdminByUsername(@PathVariable String username) {
        return userService.findByUsername(username)
                .filter(u -> u.getRole() == User.Role.ADMIN)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<Page<UserDto>> getAllAdmins(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<UserDto> admins = userService.findByRole(User.Role.ADMIN, pageable);
        return ResponseEntity.ok(admins);
    }

    @GetMapping("/search")
    public ResponseEntity<Page<UserDto>> searchAdmins(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<UserDto> admins = userService.searchByRole(User.Role.ADMIN, query, pageable);
        return ResponseEntity.ok(admins);
    }

    @GetMapping("/role/{role}")
    public ResponseEntity<List<UserDto>> getAdminsByRole(@PathVariable User.Role role) {
        return ResponseEntity.ok(userService.findByRole(role));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserDto> updateAdmin(@PathVariable Long id, @Valid @RequestBody UserDto userDto) {
        try {
            UserDto updatedAdmin = userService.updateUser(id, userDto);
            return ResponseEntity.ok(updatedAdmin);
        } catch (RuntimeException e) {
            log.error("Admin update failed: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivateAdmin(@PathVariable Long id) {
        try {
            userService.deactivateUser(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            log.error("Admin deactivation failed: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAdmin(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            log.error("Admin deletion failed: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/change-password")
    public ResponseEntity<String> changePassword(
            @PathVariable Long id,
            @RequestBody ChangePasswordDto changePasswordDto) {

        boolean success = userService.changePassword(id,
                changePasswordDto.getCurrentPassword(),
                changePasswordDto.getNewPassword());

        if (success) {
            return ResponseEntity.ok("Password changed successfully");
        } else {
            return ResponseEntity.badRequest().body("Invalid current password");
        }
    }

    @GetMapping("/stats/count")
    public ResponseEntity<Long> getActiveAdminCount() {
        long count = userService.countActiveByRole(User.Role.ADMIN);
        return ResponseEntity.ok(count);
    }
}
