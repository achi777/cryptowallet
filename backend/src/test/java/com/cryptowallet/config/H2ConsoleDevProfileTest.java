package com.cryptowallet.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Asserts that under the dev-equivalent {@code h2} profile, the dedicated
 * {@code h2ConsoleFilterChain} bean is wired and the H2 console is enabled.
 *
 * Counterpart to {@link H2ConsoleProdProfileTest}. We assert wiring rather than
 * dispatching a request because MockMvc only dispatches to Spring MVC and would
 * not reach the H2 console servlet (registered separately by H2ConsoleAutoConfiguration);
 * a regression that drops the dev SecurityFilterChain bean is what this test
 * actually needs to catch.
 */
@SpringBootTest
@ActiveProfiles("h2")
class H2ConsoleDevProfileTest {

    @Autowired
    private ApplicationContext context;

    @Test
    void h2ConsoleFilterChainBeanIsRegisteredInDevProfile() {
        assertThat(context.containsBean("h2ConsoleFilterChain"))
            .as("h2ConsoleFilterChain must be present in dev/h2 profile so /h2-console/** is permitted")
            .isTrue();
    }

    @Test
    void h2ConsoleServletIsEnabledInDevProfile() {
        // The application-h2.yml profile enables the embedded H2 console servlet.
        String enabled = context.getEnvironment().getProperty("spring.h2.console.enabled");
        assertThat(enabled)
            .as("spring.h2.console.enabled must be true under the h2 profile")
            .isEqualTo("true");
    }
}
