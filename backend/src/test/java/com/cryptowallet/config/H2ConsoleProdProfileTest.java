package com.cryptowallet.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

/**
 * Asserts the H2 console UI is NOT reachable under the prod profile.
 *
 * Defense-in-depth check (CRYPTOWALL-7):
 *   1. The dedicated {@code h2ConsoleFilterChain} is annotated {@code @Profile({"dev","h2"})},
 *      so under {@code prod} it is not instantiated and Spring Security has no chain
 *      matching {@code /h2-console/**}. The default chain has no matcher for the path either.
 *   2. {@code spring.h2.console.enabled=false} is set in application-prod.yml, so the
 *      embedded H2 servlet is never registered. Result: any request to the path returns
 *      a non-200 status (404 from the servlet container).
 *
 * Test boots the prod profile but swaps the datasource to H2 in-mem so the context
 * starts without a real Postgres — the H2 driver is on the runtime classpath.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("prod")
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:prodtest;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    // CryptoService fails-fast in prod without a KEK — supply a test value so the context boots.
    "app.security.kek=AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8="
})
class H2ConsoleProdProfileTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ApplicationContext context;

    @Test
    void h2ConsoleFilterChainBeanNotRegisteredInProdProfile() {
        // The @Profile({"dev","h2"}) annotation must keep the dev-only chain out of prod.
        assertThat(context.containsBean("h2ConsoleFilterChain"))
            .as("h2ConsoleFilterChain must NOT be present under the prod profile")
            .isFalse();
    }

    @Test
    void h2ConsoleNotReachableInProdProfile() throws Exception {
        // /h2-console/login.do is multi-segment AND contains a dot, so it can't be picked up
        // by the SPA fallback view controller (which only matches single-segment, dot-free paths).
        // Asserts non-200 — concrete result is 404 (servlet not registered + no security chain match).
        mockMvc.perform(get("/h2-console/login.do"))
            .andExpect(result -> {
                int code = result.getResponse().getStatus();
                if (code == 200) {
                    throw new AssertionError("h2-console reachable in prod profile (status=200)");
                }
            });
    }
}
