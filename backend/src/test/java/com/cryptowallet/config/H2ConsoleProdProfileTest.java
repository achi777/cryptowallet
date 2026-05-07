package com.cryptowallet.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Asserts the H2 console UI is NOT reachable under the prod profile.
 * Test boots the prod profile but swaps the datasource to H2 in-mem so the context
 * starts without a real Postgres — the H2 driver is on the runtime classpath.
 * The point of the test is `spring.h2.console.enabled` (set to false in application-prod.yml),
 * not the JDBC driver choice.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("prod")
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:prodtest;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect"
})
class H2ConsoleProdProfileTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void h2ConsoleServletIsNotRegisteredInProd() throws Exception {
        // /h2-console/login.do is multi-segment AND contains a dot, so it can't be picked up
        // by the SPA fallback view controller (which only matches single-segment, dot-free paths).
        // If H2 console were enabled, the H2 servlet would handle this path. With it disabled,
        // no handler matches and Spring returns 404.
        mockMvc.perform(get("/h2-console/login.do"))
            .andExpect(status().isNotFound());
    }
}
