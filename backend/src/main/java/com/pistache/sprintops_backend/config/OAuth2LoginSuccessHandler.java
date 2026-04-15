package com.pistache.sprintops_backend.config;

import com.pistache.sprintops_backend.model.Usuario;
import com.pistache.sprintops_backend.service.OAuth2LoginPendingStore;
import com.pistache.sprintops_backend.service.UsuarioService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Conditional;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

@Component
@Conditional(GoogleOAuthCredentialsPresentCondition.class)
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final UsuarioService usuarioService;
    private final OAuth2LoginPendingStore pendingStore;

    @Value("${app.frontend-base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    public OAuth2LoginSuccessHandler(UsuarioService usuarioService, OAuth2LoginPendingStore pendingStore) {
        this.usuarioService = usuarioService;
        this.pendingStore = pendingStore;
    }

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) throws IOException {
        String email = null;
        String name = null;
        String picture = null;
        boolean emailVerifiedByGoogle = false;

        Object principal = authentication.getPrincipal();
        if (principal instanceof OidcUser oidc) {
            email = oidc.getEmail();
            name = oidc.getFullName();
            if (!StringUtils.hasText(name)) {
                name = oidc.getNickName();
            }
            picture = oidc.getPicture();
            Boolean ev = oidc.getEmailVerified();
            emailVerifiedByGoogle = ev != null && ev;
        } else if (principal instanceof OAuth2User ou) {
            Map<String, Object> a = ou.getAttributes();
            email = (String) a.get("email");
            name = (String) a.get("name");
            picture = (String) a.get("picture");
            Object ev = a.get("email_verified");
            if (ev instanceof Boolean b) {
                emailVerifiedByGoogle = b;
            } else if (ev != null) {
                emailVerifiedByGoogle = Boolean.parseBoolean(ev.toString());
            }
        }

        String base = frontendBaseUrl.replaceAll("/$", "");
        if (!StringUtils.hasText(email)) {
            response.sendRedirect(base + "/login?oauth_error=" + URLEncoder.encode("no_email", StandardCharsets.UTF_8));
            return;
        }

        email = email.trim().toLowerCase();
        Usuario user;
        var existing = usuarioService.findByEmailUsuario(email);
        if (existing.isPresent()) {
            user = updateExistingGoogleUser(existing.get(), picture, emailVerifiedByGoogle);
        } else {
            user = buildNewGoogleUser(email, name, picture);
        }
        user = usuarioService.save(user);
        String code = pendingStore.register(user.getIdUsuario());
        response.sendRedirect(base + "/login?oauthCode=" + URLEncoder.encode(code, StandardCharsets.UTF_8));
    }

    private Usuario updateExistingGoogleUser(Usuario u, String picture, boolean emailVerifiedByGoogle) {
        if (StringUtils.hasText(picture)) {
            u.setAvatarUrl(picture.length() > 500 ? picture.substring(0, 500) : picture);
        }
        if (emailVerifiedByGoogle && "0".equals(u.getEmailVerificado())) {
            u.setEmailVerificado("1");
            u.setVerificacionToken(null);
            u.setVerificacionExpira(null);
        }
        return u;
    }

    private Usuario buildNewGoogleUser(String email, String name, String picture) {
        String nombreUsuario = uniqueNombreFromEmail(email);
        if (StringUtils.hasText(name)) {
            nombreUsuario = name.length() <= 100 ? name : name.substring(0, 100);
        }
        while (usuarioService.findByNombreUsuario(nombreUsuario).isPresent()) {
            String suffix = "_" + UUID.randomUUID().toString().substring(0, 6);
            String combined = nombreUsuario + suffix;
            nombreUsuario = combined.length() <= 100 ? combined : combined.substring(0, 100);
        }

        Usuario u = new Usuario();
        u.setNombreUsuario(nombreUsuario);
        u.setEmailUsuario(email);
        u.setPasswordHash(UUID.randomUUID().toString());
        u.setFechaRegistroUsuario(LocalDate.now());
        u.setActivoUsuario("1");
        u.setEmailVerificado("1");
        if (StringUtils.hasText(picture)) {
            u.setAvatarUrl(picture.length() > 500 ? picture.substring(0, 500) : picture);
        }
        return u;
    }

    private String uniqueNombreFromEmail(String email) {
        int at = email.indexOf('@');
        String local = at > 0 ? email.substring(0, at) : email;
        String base = local.replaceAll("[^a-zA-Z0-9_]", "_");
        if (base.length() > 80) {
            base = base.substring(0, 80);
        }
        if (base.isEmpty()) {
            base = "usuario";
        }
        String candidate = base;
        int i = 0;
        while (usuarioService.findByNombreUsuario(candidate).isPresent()) {
            candidate = base + "_" + (++i);
        }
        return candidate;
    }
}
