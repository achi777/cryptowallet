package com.cryptowallet.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        // SPA fallback: forward client-side routes to index.html so React Router
        // resolves them. Two patterns cover one- and two-segment paths without a
        // file extension (e.g. /signin, /admin, /admin/login, /admin/users).
        // Controller request mappings (/api/**) take precedence over view
        // controllers, so API endpoints are unaffected.
        registry.addViewController("/{path:[^.]*}").setViewName("forward:/index.html");
        registry.addViewController("/{path:[^.]*}/{subpath:[^.]*}").setViewName("forward:/index.html");
    }
}
