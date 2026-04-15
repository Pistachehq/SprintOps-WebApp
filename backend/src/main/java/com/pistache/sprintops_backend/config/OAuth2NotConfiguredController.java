package com.pistache.sprintops_backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.servlet.view.RedirectView;

/**
 * Si no hay ningún cliente OAuth (faltan credenciales de Google y GitHub), evita un 404 y redirige al login.
 */
@Controller
@ConditionalOnMissingBean(ClientRegistrationRepository.class)
public class OAuth2NotConfiguredController {

    @Value("${app.frontend-base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @GetMapping("/oauth2/authorization/google")
    public RedirectView googleOAuthNotConfigured() {
        return redirectNotConfigured();
    }

    @GetMapping("/oauth2/authorization/github")
    public RedirectView githubOAuthNotConfigured() {
        return redirectNotConfigured();
    }

    private RedirectView redirectNotConfigured() {
        String base = frontendBaseUrl.replaceAll("/$", "");
        return new RedirectView(base + "/login?oauth_error=not_configured");
    }
}
