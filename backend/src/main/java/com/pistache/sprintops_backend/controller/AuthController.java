package com.pistache.sprintops_backend.controller;

import com.pistache.sprintops_backend.dto.LoginRequest;
import com.pistache.sprintops_backend.dto.UsuarioDTO;
import com.pistache.sprintops_backend.model.Usuario;
import com.pistache.sprintops_backend.model.RolesDeUsuarios;
import com.pistache.sprintops_backend.service.UsuarioService;
import com.pistache.sprintops_backend.repository.RolesDeUsuariosRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private RolesDeUsuariosRepository rolesDeUsuariosRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        // Find user by username (nombre_usuario) or email
        var optUser = usuarioService.findByNombreUsuario(request.getUsername());
        if (optUser.isEmpty()) {
            optUser = usuarioService.findByEmailUsuario(request.getUsername());
        }

        if (optUser.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Usuario no encontrado"));
        }

        Usuario user = optUser.get();

        // Check password
        if (!user.getPasswordHash().equals(request.getPassword())) {
            return ResponseEntity.status(401).body(Map.of("error", "Contraseña incorrecta"));
        }

        // Get role
        String role = getRoleForUser(user.getIdUsuario());

        UsuarioDTO dto = UsuarioDTO.fromEntity(user, role);
        return ResponseEntity.ok(dto);
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
