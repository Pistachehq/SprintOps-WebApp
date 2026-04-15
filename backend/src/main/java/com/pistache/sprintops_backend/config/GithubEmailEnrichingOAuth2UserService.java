package com.pistache.sprintops_backend.config;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Conditional;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * GitHub no siempre incluye {@code email} en {@code GET /user} (correo privado). Con scope
 * {@code user:email} el correo aparece en {@code GET /user/emails}. Sin esto el login puede
 * fallar aunque antes pareciera funcionar según la visibilidad del correo en GitHub.
 */
@Component
@Conditional(OAuth2AnyProviderConfiguredCondition.class)
public class GithubEmailEnrichingOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private static final String GITHUB_REGISTRATION_ID = "github";

    private final OAuth2UserService<OAuth2UserRequest, OAuth2User> delegate = new DefaultOAuth2UserService();
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User user = delegate.loadUser(userRequest);
        if (!GITHUB_REGISTRATION_ID.equals(userRequest.getClientRegistration().getRegistrationId())) {
            return user;
        }

        Map<String, Object> attrs = new LinkedHashMap<>(user.getAttributes());
        String email = asString(attrs.get("email"));
        if (StringUtils.hasText(email)) {
            return user;
        }

        String fromEmails = fetchPrimaryEmail(userRequest.getAccessToken().getTokenValue());
        if (StringUtils.hasText(fromEmails)) {
            attrs.put("email", fromEmails);
            return new DefaultOAuth2User(user.getAuthorities(), attrs, "id");
        }

        return user;
    }

    private static String asString(Object o) {
        return o == null ? null : o.toString();
    }

    private String fetchPrimaryEmail(String accessToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            headers.set("Accept", "application/vnd.github+json");
            ResponseEntity<String> response = restTemplate.exchange(
                    "https://api.github.com/user/emails",
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    String.class);
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                return null;
            }
            JsonNode root = objectMapper.readTree(response.getBody());
            if (!root.isArray()) {
                return null;
            }
            String firstVerified = null;
            for (JsonNode node : root) {
                if (!node.path("verified").asBoolean(false)) {
                    continue;
                }
                String em = node.path("email").asText(null);
                if (!StringUtils.hasText(em)) {
                    continue;
                }
                if (node.path("primary").asBoolean(false)) {
                    return em;
                }
                if (firstVerified == null) {
                    firstVerified = em;
                }
            }
            return firstVerified;
        } catch (Exception ignored) {
            return null;
        }
    }
}
