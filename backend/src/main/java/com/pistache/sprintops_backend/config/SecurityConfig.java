package com.pistache.sprintops_backend.config;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(
            HttpSecurity http,
            ObjectProvider<ClientRegistrationRepository> clientRegistrations,
            ObjectProvider<OAuth2LoginSuccessHandler> oauth2SuccessHandler,
            ObjectProvider<GithubEmailEnrichingOAuth2UserService> githubOAuth2UserService) throws Exception {
        http.csrf(csrf -> csrf.disable());
        http.authorizeHttpRequests(auth -> auth.anyRequest().permitAll());

        ClientRegistrationRepository repo = clientRegistrations.getIfAvailable();
        OAuth2LoginSuccessHandler successHandler = oauth2SuccessHandler.getIfAvailable();
        GithubEmailEnrichingOAuth2UserService oauth2UserService = githubOAuth2UserService.getIfAvailable();
        if (repo != null && successHandler != null) {
            http.oauth2Login(oauth2 -> {
                oauth2.successHandler(successHandler);
                if (oauth2UserService != null) {
                    OAuth2UserService<OAuth2UserRequest, OAuth2User> us = oauth2UserService;
                    oauth2.userInfoEndpoint(userInfo -> {
                        userInfo.userService(us);
                        userInfo.oidcUserService(new OidcUserService());
                    });
                }
            });
        }

        return http.build();
    }
}
