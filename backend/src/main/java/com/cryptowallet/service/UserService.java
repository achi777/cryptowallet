package com.cryptowallet.service;

import com.cryptowallet.dto.UserDto;
import com.cryptowallet.dto.UserRegistrationDto;
import com.cryptowallet.entity.User;
import com.cryptowallet.repository.UserRepository;
import com.cryptowallet.security.CryptoService;
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
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CryptoService cryptoService;

    public UserDto registerUser(UserRegistrationDto registrationDto) {
        return registerUserWithRole(registrationDto, User.Role.USER);
    }

    public UserDto registerUserWithRole(UserRegistrationDto registrationDto, User.Role role) {
        if (userRepository.existsByUsername(registrationDto.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        if (userRepository.existsByEmail(registrationDto.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        // Provision a per-user data-encryption-key, wrapped by the master KEK.
        byte[] dek = cryptoService.generateDek();
        String wrappedDek = cryptoService.wrapDek(dek);
        java.util.Arrays.fill(dek, (byte) 0);

        User user = User.builder()
                .username(registrationDto.getUsername())
                .email(registrationDto.getEmail())
                .password(passwordEncoder.encode(registrationDto.getPassword()))
                .firstName(registrationDto.getFirstName())
                .lastName(registrationDto.getLastName())
                .role(role)
                .active(true)
                .wrappedDek(wrappedDek)
                .build();

        User savedUser = userRepository.save(user);
        log.info("User registered successfully: {} with role: {}", savedUser.getUsername(), savedUser.getRole());

        return convertToDto(savedUser);
    }

    @Transactional(readOnly = true)
    public Optional<UserDto> findByUsername(String username) {
        return userRepository.findByUsername(username)
                .map(this::convertToDto);
    }

    @Transactional(readOnly = true)
    public Optional<UserDto> findById(Long id) {
        return userRepository.findById(id)
                .map(this::convertToDto);
    }

    @Transactional(readOnly = true)
    public List<UserDto> findAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public Page<UserDto> getAllUsersPaged(Pageable pageable) {
        Page<User> users = userRepository.findAll(pageable);
        return users.map(this::convertToDto);
    }

    @Transactional(readOnly = true)
    public Page<UserDto> findByRole(User.Role role, Pageable pageable) {
        return userRepository.findByRole(role, pageable).map(this::convertToDto);
    }

    @Transactional(readOnly = true)
    public List<UserDto> findByRole(User.Role role) {
        return userRepository.findByRole(role).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<UserDto> searchByRole(User.Role role, String search, Pageable pageable) {
        return userRepository.searchByRole(role, search, pageable).map(this::convertToDto);
    }

    public UserDto updateUser(Long id, UserDto userDto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setFirstName(userDto.getFirstName());
        user.setLastName(userDto.getLastName());
        user.setEmail(userDto.getEmail());
        user.setActive(userDto.getActive());
        if (userDto.getRole() != null) {
            user.setRole(userDto.getRole());
        }

        User updatedUser = userRepository.save(user);
        log.info("User updated successfully: {}", updatedUser.getUsername());

        return convertToDto(updatedUser);
    }

    public void deactivateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setActive(false);
        userRepository.save(user);
        log.info("User deactivated: {}", user.getUsername());
    }

    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found");
        }

        userRepository.deleteById(id);
        log.info("User deleted successfully with id: {}", id);
    }

    public Optional<UserDto> authenticateUser(String username, String password) {
        Optional<User> userOpt = userRepository.findByUsername(username);

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (Boolean.TRUE.equals(user.getActive()) && passwordEncoder.matches(password, user.getPassword())) {
                user.setLastLogin(LocalDateTime.now());
                userRepository.save(user);
                log.info("User authenticated successfully: {} (role={})", username, user.getRole());
                return Optional.of(convertToDto(user));
            }
        }

        log.warn("Authentication failed for username: {}", username);
        return Optional.empty();
    }

    public boolean changePassword(Long userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            log.warn("Invalid current password for user: {}", user.getUsername());
            return false;
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        log.info("Password changed successfully for user: {}", user.getUsername());
        return true;
    }

    @Transactional(readOnly = true)
    public long countActiveByRole(User.Role role) {
        return userRepository.countActiveByRole(role);
    }

    @Transactional(readOnly = true)
    public long countByRoleAndLastLoginSince(User.Role role, LocalDateTime since) {
        return userRepository.countByRoleAndLastLoginSince(role, since);
    }

    private UserDto convertToDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setRole(user.getRole());
        dto.setActive(user.getActive());
        dto.setLastLogin(user.getLastLogin());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        return dto;
    }
}
