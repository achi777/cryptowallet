package com.cryptowallet.controller;

import com.cryptowallet.dto.UserDto;
import com.cryptowallet.dto.UserRegistrationDto;
import com.cryptowallet.entity.User;
import com.cryptowallet.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    @Test
    void signInWithValidAdminEmailReturnsOkAndAdminRole() throws Exception {
        UserDto admin = new UserDto();
        admin.setId(1L);
        admin.setUsername("admin");
        admin.setEmail("admin@cryptowall.local");
        admin.setRole(User.Role.ADMIN);
        admin.setActive(true);
        when(userService.authenticateByEmail(eq("admin@cryptowall.local"), eq("correct-pw")))
                .thenReturn(Optional.of(admin));

        String body = objectMapper.writeValueAsString(Map.of(
                "email", "admin@cryptowall.local",
                "password", "correct-pw"));

        mockMvc.perform(post("/api/auth/signin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.user.role").value("ADMIN"))
                .andExpect(jsonPath("$.user.email").value("admin@cryptowall.local"));
    }

    @Test
    void signInWithValidCustomerEmailReturnsOkAndUserRole() throws Exception {
        UserDto customer = new UserDto();
        customer.setId(2L);
        customer.setUsername("customer");
        customer.setEmail("customer@cryptowall.local");
        customer.setRole(User.Role.USER);
        customer.setActive(true);
        when(userService.authenticateByEmail(eq("customer@cryptowall.local"), eq("good-pw")))
                .thenReturn(Optional.of(customer));

        String body = objectMapper.writeValueAsString(Map.of(
                "email", "customer@cryptowall.local",
                "password", "good-pw"));

        mockMvc.perform(post("/api/auth/signin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.user.role").value("USER"))
                .andExpect(jsonPath("$.user.email").value("customer@cryptowall.local"));
    }

    @Test
    void registerWithValidPayloadReturnsCreatedAndUser() throws Exception {
        UserDto created = new UserDto();
        created.setId(42L);
        created.setUsername("alice");
        created.setEmail("alice@example.com");
        created.setFirstName("Alice");
        created.setLastName("Anderson");
        created.setRole(User.Role.USER);
        created.setActive(true);
        when(userService.registerUser(any(UserRegistrationDto.class))).thenReturn(created);

        Map<String, String> body = new HashMap<>();
        body.put("username", "alice");
        body.put("email", "alice@example.com");
        body.put("password", "password123");
        body.put("firstName", "Alice");
        body.put("lastName", "Anderson");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.user.email").value("alice@example.com"))
                .andExpect(jsonPath("$.user.role").value("USER"));
    }

    @Test
    void registerWithDuplicateEmailReturnsBadRequest() throws Exception {
        when(userService.registerUser(any(UserRegistrationDto.class)))
                .thenThrow(new RuntimeException("Email already exists"));

        Map<String, String> body = new HashMap<>();
        body.put("username", "alice");
        body.put("email", "taken@example.com");
        body.put("password", "password123");
        body.put("firstName", "Alice");
        body.put("lastName", "Anderson");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsStringIgnoringCase("email")));
    }

    @Test
    void registerWithDuplicateUsernameReturnsBadRequest() throws Exception {
        when(userService.registerUser(any(UserRegistrationDto.class)))
                .thenThrow(new RuntimeException("Username already exists"));

        Map<String, String> body = new HashMap<>();
        body.put("username", "taken");
        body.put("email", "alice@example.com");
        body.put("password", "password123");
        body.put("firstName", "Alice");
        body.put("lastName", "Anderson");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsStringIgnoringCase("username")));
    }

    @Test
    void registerWithBlankEmailReturnsBadRequest() throws Exception {
        Map<String, String> body = new HashMap<>();
        body.put("username", "alice");
        body.put("email", "");
        body.put("password", "password123");
        body.put("firstName", "Alice");
        body.put("lastName", "Anderson");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void registerWithShortPasswordReturnsBadRequest() throws Exception {
        Map<String, String> body = new HashMap<>();
        body.put("username", "alice");
        body.put("email", "alice@example.com");
        body.put("password", "short");
        body.put("firstName", "Alice");
        body.put("lastName", "Anderson");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void signInWithUnknownEmailReturnsUnauthorized() throws Exception {
        when(userService.authenticateByEmail(eq("nobody@cryptowall.local"), eq("anything")))
                .thenReturn(Optional.empty());

        String body = objectMapper.writeValueAsString(Map.of(
                "email", "nobody@cryptowall.local",
                "password", "anything"));

        mockMvc.perform(post("/api/auth/signin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }
}
