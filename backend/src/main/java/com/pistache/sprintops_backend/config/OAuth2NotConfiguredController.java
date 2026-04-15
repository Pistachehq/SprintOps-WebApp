package com.pistache.sprintops_backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.servlet.view.RedirectView;

/**
 * Si no hay cliente OAuth registrado (faltan GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET), evita un 404
 * críptico y devuelve al front con un código de error legible.
 */
@Controller
@ConditionalOnMissingBean(ClientRegistrationRepository.class)
public class OAuth2NotConfiguredController {

    @Value("${app.frontend-base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @GetMapping("/oauth2/authorization/google")
    public RedirectView googleOAuthNotConfigured() {
        String base = frontendBaseUrl.replaceAll("/$", "");
        return new RedirectView(base + "/login?oauth_error=not_configured");
    }
}
