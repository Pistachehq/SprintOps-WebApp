package com.pistache.sprintops_backend.controller;

import com.pistache.sprintops_backend.dto.LoginRequest;
import com.pistache.sprintops_backend.dto.RegisterRequest;
import com.pistache.sprintops_backend.dto.UsuarioDTO;
import com.pistache.sprintops_backend.dto.VerifyEmailRequest;
import com.pistache.sprintops_backend.model.Usuario;
import com.pistache.sprintops_backend.model.RolesDeUsuarios;
import com.pistache.sprintops_backend.service.UsuarioService;
import com.pistache.sprintops_backend.service.OAuth2LoginPendingStore;
import com.pistache.sprintops_backend.service.VerificationMailService;
import com.pistache.sprintops_backend.repository.RolesDeUsuariosRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private RolesDeUsuariosRepository rolesDeUsuariosRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private VerificationMailService verificationMailService;

    @Autowired
    private OAuth2LoginPendingStore oauth2LoginPendingStore;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        var optUser = usuarioService.findByEmailUsuario(request.getEmail());

        if (optUser.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Usuario no encontrado"));
        }

        Usuario user = optUser.get();

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            return ResponseEntity.status(401).body(Map.of("error", "Contraseña incorrecta"));
        }

        if ("0".equals(user.getEmailVerificado())) {
            return ResponseEntity.status(403).body(Map.of(
                    "error", "Debes verificar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada."));
        }

        // Get role
        String role = getRoleForUser(user.getIdUsuario());

        UsuarioDTO dto = UsuarioDTO.fromEntity(user, role);
        return ResponseEntity.ok(dto);
    }

    /**
     * Completa el login con Google: el backend redirige al front con ?oauthCode=... tras OAuth2;
     * el front llama aquí una vez para obtener el mismo cuerpo que /login.
     */
    @PostMapping("/oauth-exchange")
    public ResponseEntity<?> oauthExchange(@RequestBody Map<String, String> body) {
        String code = body != null ? body.get("code") : null;
        if (!StringUtils.hasText(code)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Código inválido"));
        }
        var userIdOpt = oauth2LoginPendingStore.consume(code.trim());
        if (userIdOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Código expirado o ya usado"));
        }
        var userOpt = usuarioService.findById(userIdOpt.get());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Usuario no encontrado"));
        }
        Usuario user = userOpt.get();
        String role = getRoleForUser(user.getIdUsuario());
        return ResponseEntity.ok(UsuarioDTO.fromEntity(user, role));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (request == null || !StringUtils.hasText(request.getEmail()) || !StringUtils.hasText(request.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Correo y contraseña son obligatorios"));
        }
        String email = request.getEmail().trim().toLowerCase();
        if (request.getPassword().length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "La contraseña debe tener al menos 6 caracteres"));
        }
        if (usuarioService.findByEmailUsuario(email).isPresent()) {
            return ResponseEntity.status(409).body(Map.of("error", "Ya existe una cuenta con este correo"));
        }

        String nombreUsuario = uniqueNombreFromEmail(email);
        String token = UUID.randomUUID().toString();

        Usuario u = new Usuario();
        u.setNombreUsuario(nombreUsuario);
        u.setEmailUsuario(email);
        u.setPasswordHash(request.getPassword());
        u.setFechaRegistroUsuario(LocalDate.now());
        u.setActivoUsuario("1");
        u.setEmailVerificado("0");
        u.setVerificacionToken(token);
        u.setVerificacionExpira(Instant.now().plus(48, ChronoUnit.HOURS));

        usuarioService.save(u);

        boolean smtpOn = verificationMailService.isMailConfigured();
        try {
            verificationMailService.sendAccountVerificationEmail(email, nombreUsuario, token);
        } catch (RuntimeException ex) {
            if (smtpOn) {
                return ResponseEntity.status(500).body(Map.of(
                        "error", "Cuenta creada pero no se pudo enviar el correo. Intenta de nuevo más tarde o contacta soporte."));
            }
        }

        boolean dispatched = smtpOn;
        return ResponseEntity.ok(Map.of(
                "message", dispatched
                        ? "Te enviamos un correo para verificar tu cuenta."
                        : "Cuenta creada. Configura SMTP (spring.mail.host) para enviar el correo; mientras tanto revisa los logs del servidor para el enlace de verificación.",
                "emailDispatched", dispatched));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestBody VerifyEmailRequest request) {
        if (request == null || !StringUtils.hasText(request.getToken())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Token inválido"));
        }
        var opt = usuarioService.findByVerificacionToken(request.getToken().trim());
        if (opt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El enlace no es válido o ya fue usado"));
        }
        Usuario u = opt.get();
        if (u.getVerificacionExpira() != null && Instant.now().isAfter(u.getVerificacionExpira())) {
            return ResponseEntity.badRequest().body(Map.of("error", "El enlace expiró. Regístrate de nuevo o solicita un nuevo correo."));
        }
        u.setEmailVerificado("1");
        u.setVerificacionToken(null);
        u.setVerificacionExpira(null);
        usuarioService.save(u);
        return ResponseEntity.ok(Map.of("message", "Correo verificado. Ya puedes iniciar sesión."));
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

    private String getRoleForUser(Integer userId) {
        List<RolesDeUsuarios> roles = rolesDeUsuariosRepository.findByUsuarioIdUsuario(userId);
        if (!roles.isEmpty()) {
            String roleName = roles.get(0).getRol().getNombreRol();
            return mapRoleName(roleName);
        }
        return "developer";
    }

    private String mapRoleName(String dbRole) {
        if (dbRole == null) return "developer";
        return switch (dbRole.toLowerCase()) {
            case "product owner", "productowner" -> "productOwner";
            case "scrum master", "scrummaster" -> "scrumMaster";
            case "developer" -> "developer";
            default -> dbRole;
        };
    }
}
