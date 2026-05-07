package com.cryptowallet.service;

import com.cryptowallet.dto.UserDto;
import com.cryptowallet.dto.UserRegistrationDto;
import com.cryptowallet.entity.User;
import com.cryptowallet.repository.UserRepository;
import com.cryptowallet.security.CryptoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class UserServiceTest {

    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private CryptoService cryptoService;
    private UserService userService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        cryptoService = mock(CryptoService.class);
        userService = new UserService(userRepository, passwordEncoder, cryptoService);

        when(passwordEncoder.encode(anyString())).thenReturn("encoded");
        when(cryptoService.generateDek()).thenReturn(new byte[32]);
        when(cryptoService.wrapDek(any())).thenReturn("wrapped-dek");
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void registerUserDefaultsRoleToUser() {
        UserDto dto = userService.registerUser(sampleRegistration("alice", "alice@example.com"));

        assertThat(dto.getRole()).isEqualTo(User.Role.USER);
        assertThat(dto.getUsername()).isEqualTo("alice");
    }

    @Test
    void registerUserWithRoleAdminProducesAdmin() {
        UserDto dto = userService.registerUserWithRole(
                sampleRegistration("root", "root@example.com"), User.Role.ADMIN);

        assertThat(dto.getRole()).isEqualTo(User.Role.ADMIN);
    }

    @Test
    void findByRoleReturnsOnlyMatchingRole() {
        User admin = User.builder()
                .id(1L).username("root").email("r@e").password("x")
                .firstName("Root").lastName("User").role(User.Role.ADMIN).active(true).build();
        Pageable pageable = PageRequest.of(0, 10);
        Page<User> page = new PageImpl<>(List.of(admin), pageable, 1);
        when(userRepository.findByRole(User.Role.ADMIN, pageable)).thenReturn(page);

        Page<UserDto> result = userService.findByRole(User.Role.ADMIN, pageable);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getRole()).isEqualTo(User.Role.ADMIN);
    }

    @Test
    void authenticateUserPopulatesRoleOnDto() {
        User stored = User.builder()
                .id(2L).username("bob").email("b@e").password("hashed")
                .firstName("Bob").lastName("Builder").role(User.Role.USER).active(true).build();
        when(userRepository.findByUsername("bob")).thenReturn(Optional.of(stored));
        when(passwordEncoder.matches("pw", "hashed")).thenReturn(true);

        Optional<UserDto> result = userService.authenticateUser("bob", "pw");

        assertThat(result).isPresent();
        assertThat(result.get().getRole()).isEqualTo(User.Role.USER);
        assertThat(result.get().getLastLogin()).isNotNull();
    }

    @Test
    void authenticateUserFailsForInactiveAccount() {
        User stored = User.builder()
                .id(3L).username("ghost").email("g@e").password("hashed")
                .role(User.Role.USER).active(false).build();
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.of(stored));
        when(passwordEncoder.matches("pw", "hashed")).thenReturn(true);

        assertThat(userService.authenticateUser("ghost", "pw")).isEmpty();
    }

    private UserRegistrationDto sampleRegistration(String username, String email) {
        UserRegistrationDto dto = new UserRegistrationDto();
        dto.setUsername(username);
        dto.setEmail(email);
        dto.setPassword("password123");
        dto.setFirstName("First");
        dto.setLastName("Last");
        return dto;
    }
}
