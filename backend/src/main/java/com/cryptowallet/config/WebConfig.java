package com.cryptowallet.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        // SPA fallback: any single-segment path without a file extension forwards to index.html
        // so the React Router can resolve client-side routes like /wallet, /transactions, /admin.
        registry.addViewController("/{path:[^.]*}").setViewName("forward:/index.html");
    }
}
