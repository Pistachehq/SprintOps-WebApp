package com.pistache.sprintops_backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Conditional;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.oidc.IdTokenClaimNames;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

@Configuration
@Conditional(OAuth2AnyProviderConfiguredCondition.class)
public class OAuth2ClientRegistrationsConfig {

    @Bean
    public ClientRegistrationRepository clientRegistrationRepository(
            @Value("${GOOGLE_CLIENT_ID:}") String googleId,
            @Value("${GOOGLE_CLIENT_SECRET:}") String googleSecret,
            @Value("${GITHUB_CLIENT_ID:}") String githubId,
            @Value("${GITHUB_CLIENT_SECRET:}") String githubSecret) {
        List<ClientRegistration> registrations = new ArrayList<>();
        if (StringUtils.hasText(googleId) && StringUtils.hasText(googleSecret)) {
            registrations.add(ClientRegistration.withRegistrationId("google")
                    .clientId(googleId)
                    .clientSecret(googleSecret)
                    .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                    .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                    .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                    .scope("openid", "profile", "email")
                    .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
                    .tokenUri("https://www.googleapis.com/oauth2/v4/token")
                    .userInfoUri("https://www.googleapis.com/oauth2/v3/userinfo")
                    .userNameAttributeName(IdTokenClaimNames.SUB)
                    .jwkSetUri("https://www.googleapis.com/oauth2/v3/certs")
                    .clientName("Google")
                    .build());
        }
        if (StringUtils.hasText(githubId) && StringUtils.hasText(githubSecret)) {
            registrations.add(ClientRegistration.withRegistrationId("github")
                    .clientId(githubId)
                    .clientSecret(githubSecret)
                    .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                    .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                    .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                    .scope("read:user", "user:email")
                    .authorizationUri("https://github.com/login/oauth/authorize")
                    .tokenUri("https://github.com/login/oauth/access_token")
                    .userInfoUri("https://api.github.com/user")
                    .userNameAttributeName("id")
                    .clientName("GitHub")
                    .build());
        }
        if (registrations.isEmpty()) {
            throw new IllegalStateException("OAuth2AnyProviderConfiguredCondition debería garantizar al menos un proveedor");
        }
        return new InMemoryClientRegistrationRepository(registrations);
    }
}
