package com.cryptowallet.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.forwardedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void homeRouteServesSpaShellWithoutAuth() throws Exception {
        // GET / is handled by Spring's ResourceHttpRequestHandler welcome-file logic, which
        // internally forwards to index.html. Status 200 + that forward proves Security let it through.
        mockMvc.perform(get("/"))
            .andExpect(status().isOk())
            .andExpect(forwardedUrl("index.html"));
    }

    @Test
    void clientSideRouteForwardsToIndexHtml() throws Exception {
        // The WebConfig SPA fallback view controller forwards unknown extensionless paths to /index.html
        // so React Router can take over.
        mockMvc.perform(get("/wallet"))
            .andExpect(status().isOk())
            .andExpect(forwardedUrl("/index.html"));
    }

    @Test
    void staticAssetPathIsNotBlockedBySecurity() throws Exception {
        // Asset doesn't exist in test classpath, so 404 is expected — but NOT 403.
        // 403 here would mean the security chain rejected the request before the static handler ran.
        mockMvc.perform(get("/assets/index-deadbeef.js"))
            .andExpect(status().isNotFound());
    }

    @Test
    void multiSegmentClientSideRouteForwardsToIndexHtml() throws Exception {
        // Two-segment SPA paths like /admin/login (legacy bookmark, now a React-Router redirect
        // to /signin) and /admin/users must also be served by the SPA shell. Without the
        // multi-segment view-controller mapping in WebConfig, Spring returns its JSON 404
        // page and React Router never gets a chance to redirect — the user-visible bug
        // behind CRYPTOWALL-18.
        mockMvc.perform(get("/admin/login"))
            .andExpect(status().isOk())
            .andExpect(forwardedUrl("/index.html"));

        mockMvc.perform(get("/admin/users"))
            .andExpect(status().isOk())
            .andExpect(forwardedUrl("/index.html"));
    }
}
