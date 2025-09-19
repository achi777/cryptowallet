package com.cryptowallet.service;

import com.cryptowallet.dto.AdminDto;
import com.cryptowallet.dto.AdminRegistrationDto;
import com.cryptowallet.entity.Admin;
import com.cryptowallet.repository.AdminRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AdminService {
    
    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    
    public AdminDto registerAdmin(AdminRegistrationDto registrationDto) {
        if (adminRepository.existsByUsername(registrationDto.getUsername())) {
            throw new RuntimeException("Admin username already exists");
        }
        
        if (adminRepository.existsByEmail(registrationDto.getEmail())) {
            throw new RuntimeException("Admin email already exists");
        }
        
        Admin admin = Admin.builder()
                .username(registrationDto.getUsername())
                .email(registrationDto.getEmail())
                .password(passwordEncoder.encode(registrationDto.getPassword()))
                .firstName(registrationDto.getFirstName())
                .lastName(registrationDto.getLastName())
                .role(registrationDto.getRole())
                .active(true)
                .build();
        
        Admin savedAdmin = adminRepository.save(admin);
        log.info("Admin registered successfully: {} with role: {}", savedAdmin.getUsername(), savedAdmin.getRole());
        
        return convertToDto(savedAdmin);
    }
    
    @Transactional(readOnly = true)
    public Optional<AdminDto> findByUsername(String username) {
        return adminRepository.findByUsername(username)
                .map(this::convertToDto);
    }
    
    @Transactional(readOnly = true)
    public Optional<AdminDto> findById(Long id) {
        return adminRepository.findById(id)
                .map(this::convertToDto);
    }
    
    @Transactional(readOnly = true)
    public Page<AdminDto> findAllAdmins(Pageable pageable) {
        return adminRepository.findByActiveTrue(pageable)
                .map(this::convertToDto);
    }
    
    @Transactional(readOnly = true)
    public Page<AdminDto> searchAdmins(String search, Pageable pageable) {
        return adminRepository.searchAdmins(search, pageable)
                .map(this::convertToDto);
    }
    
    @Transactional(readOnly = true)
    public List<AdminDto> findByRole(Admin.AdminRole role) {
        return adminRepository.findByRole(role).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    public AdminDto updateAdmin(Long id, AdminDto adminDto) {
        Admin admin = adminRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        
        admin.setFirstName(adminDto.getFirstName());
        admin.setLastName(adminDto.getLastName());
        admin.setEmail(adminDto.getEmail());
        admin.setRole(adminDto.getRole());
        admin.setActive(adminDto.getActive());
        
        Admin updatedAdmin = adminRepository.save(admin);
        log.info("Admin updated successfully: {}", updatedAdmin.getUsername());
        
        return convertToDto(updatedAdmin);
    }
    
    public void deactivateAdmin(Long id) {
        Admin admin = adminRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        
        admin.setActive(false);
        adminRepository.save(admin);
        
        log.info("Admin deactivated: {}", admin.getUsername());
    }
    
    public void deleteAdmin(Long id) {
        if (!adminRepository.existsById(id)) {
            throw new RuntimeException("Admin not found");
        }
        
        adminRepository.deleteById(id);
        log.info("Admin deleted with id: {}", id);
    }
    
    public Optional<AdminDto> authenticateAdmin(String username, String password) {
        Optional<Admin> adminOpt = adminRepository.findByUsername(username);
        
        if (adminOpt.isPresent()) {
            Admin admin = adminOpt.get();
            if (admin.getActive() && passwordEncoder.matches(password, admin.getPassword())) {
                admin.setLastLogin(LocalDateTime.now());
                adminRepository.save(admin);
                
                log.info("Admin authenticated successfully: {}", username);
                return Optional.of(convertToDto(admin));
            }
        }
        
        log.warn("Admin authentication failed for username: {}", username);
        return Optional.empty();
    }
    
    public boolean changePassword(Long adminId, String currentPassword, String newPassword) {
        Admin admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        
        if (!passwordEncoder.matches(currentPassword, admin.getPassword())) {
            log.warn("Invalid current password for admin: {}", admin.getUsername());
            return false;
        }
        
        admin.setPassword(passwordEncoder.encode(newPassword));
        adminRepository.save(admin);
        
        log.info("Password changed successfully for admin: {}", admin.getUsername());
        return true;
    }
    
    @Transactional(readOnly = true)
    public long getActiveAdminCount() {
        return adminRepository.countActiveAdmins();
    }
    
    @Transactional(readOnly = true)
    public long getRecentlyActiveAdminCount(LocalDateTime since) {
        return adminRepository.countAdminsLoggedInSince(since);
    }
    
    private AdminDto convertToDto(Admin admin) {
        AdminDto dto = new AdminDto();
        dto.setId(admin.getId());
        dto.setUsername(admin.getUsername());
        dto.setEmail(admin.getEmail());
        dto.setFirstName(admin.getFirstName());
        dto.setLastName(admin.getLastName());
        dto.setRole(admin.getRole());
        dto.setActive(admin.getActive());
        dto.setLastLogin(admin.getLastLogin());
        dto.setCreatedAt(admin.getCreatedAt());
        dto.setUpdatedAt(admin.getUpdatedAt());
        return dto;
    }
}