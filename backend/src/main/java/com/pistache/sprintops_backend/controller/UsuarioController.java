package com.pistache.sprintops_backend.controller;

import com.pistache.sprintops_backend.dto.UsuarioDTO;
import com.pistache.sprintops_backend.dto.ProyectoDTO;
import com.pistache.sprintops_backend.model.Usuario;
import com.pistache.sprintops_backend.model.RolesDeUsuarios;
import com.pistache.sprintops_backend.model.Proyecto;
import com.pistache.sprintops_backend.service.UsuarioService;
import com.pistache.sprintops_backend.service.ProyectoService;
import com.pistache.sprintops_backend.repository.RolesDeUsuariosRepository;
import com.pistache.sprintops_backend.repository.InfoUsuarioEquipoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "*")
public class UsuarioController {

    @Autowired
    private UsuarioService usuarioService;
    @Autowired
    private RolesDeUsuariosRepository rolesDeUsuariosRepository;
    @Autowired
    private InfoUsuarioEquipoRepository infoUsuarioEquipoRepository;
    @Autowired
    private ProyectoService proyectoService;

    @GetMapping
    public List<UsuarioDTO> getAll() {
        return usuarioService.findAll().stream()
                .map(u -> UsuarioDTO.fromEntity(u, getRoleForUser(u.getIdUsuario())))
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UsuarioDTO> getById(@PathVariable Integer id) {
        return usuarioService.findById(id)
                .map(u -> ResponseEntity.ok(UsuarioDTO.fromEntity(u, getRoleForUser(id))))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Usuario create(@RequestBody Usuario usuario) {
        return usuarioService.save(usuario);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UsuarioDTO> update(@PathVariable Integer id, @RequestBody java.util.Map<String, Object> body) {
        var existing = usuarioService.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Usuario usuario = existing.get();
        if (body.containsKey("name")) usuario.setNombreUsuario((String) body.get("name"));
        if (body.containsKey("avatarUrl")) usuario.setAvatarUrl((String) body.get("avatarUrl"));
        UsuarioDTO dto = UsuarioDTO.fromEntity(usuarioService.save(usuario), getRoleForUser(id));
        return ResponseEntity.ok(dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        if (!usuarioService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        usuarioService.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/proyectos")
    public ResponseEntity<List<java.util.Map<String, Object>>> getUserProjects(@PathVariable Integer id) {
        var memberships = infoUsuarioEquipoRepository.findByUsuarioIdUsuario(id);
        List<java.util.Map<String, Object>> result = memberships.stream()
            .flatMap(m -> {
                Integer equipoId = m.getEquipo().getIdEquipo();
                // Get user's role in this team
                List<RolesDeUsuarios> teamRoles = rolesDeUsuariosRepository.findByEquipoIdEquipo(equipoId);
                String userRole = teamRoles.stream()
                    .filter(r -> r.getUsuario().getIdUsuario().equals(id))
                    .map(r -> r.getRol().getNombreRol())
                    .findFirst().orElse("Developer");

                return proyectoService.findByEquipo(m.getEquipo()).stream()
                    .map(p -> {
                        java.util.Map<String, Object> map = new java.util.LinkedHashMap<>();
                        map.put("id", p.getIdProyecto());
                        map.put("name", p.getNombreProyecto());
                        map.put("description", p.getDescripcionProyecto());
                        map.put("role", userRole);
                        return map;
                    });
            })
            .collect(Collectors.toList());
        return ResponseEntity.ok(result);
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
            default -> "developer";
        };
    }
}
