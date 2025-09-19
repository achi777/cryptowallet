package com.cryptowallet.controller;

import com.cryptowallet.dto.*;
import com.cryptowallet.entity.Admin;
import com.cryptowallet.service.AdminService;
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

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:3000")
public class AdminController {
    
    private final AdminService adminService;
    
    @PostMapping("/register")
    public ResponseEntity<AuthResponseDto> registerAdmin(@Valid @RequestBody AdminRegistrationDto registrationDto) {
        try {
            AdminDto admin = adminService.registerAdmin(registrationDto);
            AuthResponseDto response = new AuthResponseDto();
            response.setMessage("Admin registered successfully");
            response.setSuccess(true);
            response.setAdmin(admin);
            response.setUser(null);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Admin registration failed: {}", e.getMessage());
            AuthResponseDto response = new AuthResponseDto();
            response.setMessage(e.getMessage());
            response.setSuccess(false);
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> loginAdmin(@Valid @RequestBody AdminLoginDto loginDto) {
        Optional<AdminDto> adminOpt = adminService.authenticateAdmin(loginDto.getUsername(), loginDto.getPassword());
        
        AuthResponseDto response = new AuthResponseDto();
        if (adminOpt.isPresent()) {
            response.setMessage("Admin login successful");
            response.setSuccess(true);
            response.setAdmin(adminOpt.get());
            response.setUser(null);
            return ResponseEntity.ok(response);
        } else {
            response.setMessage("Invalid credentials or inactive account");
            response.setSuccess(false);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<AdminDto> getAdminById(@PathVariable Long id) {
        Optional<AdminDto> admin = adminService.findById(id);
        return admin.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/username/{username}")
    public ResponseEntity<AdminDto> getAdminByUsername(@PathVariable String username) {
        Optional<AdminDto> admin = adminService.findByUsername(username);
        return admin.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping
    public ResponseEntity<Page<AdminDto>> getAllAdmins(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<AdminDto> admins = adminService.findAllAdmins(pageable);
        return ResponseEntity.ok(admins);
    }
    
    @GetMapping("/search")
    public ResponseEntity<Page<AdminDto>> searchAdmins(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<AdminDto> admins = adminService.searchAdmins(query, pageable);
        return ResponseEntity.ok(admins);
    }
    
    @GetMapping("/role/{role}")
    public ResponseEntity<List<AdminDto>> getAdminsByRole(@PathVariable Admin.AdminRole role) {
        List<AdminDto> admins = adminService.findByRole(role);
        return ResponseEntity.ok(admins);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<AdminDto> updateAdmin(@PathVariable Long id, @Valid @RequestBody AdminDto adminDto) {
        try {
            AdminDto updatedAdmin = adminService.updateAdmin(id, adminDto);
            return ResponseEntity.ok(updatedAdmin);
        } catch (RuntimeException e) {
            log.error("Admin update failed: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
    
    @PutMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivateAdmin(@PathVariable Long id) {
        try {
            adminService.deactivateAdmin(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            log.error("Admin deactivation failed: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAdmin(@PathVariable Long id) {
        try {
            adminService.deleteAdmin(id);
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
        
        boolean success = adminService.changePassword(id, 
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
        long count = adminService.getActiveAdminCount();
        return ResponseEntity.ok(count);
    }
}