package com.pistache.sprintops_backend.controller;

import com.pistache.sprintops_backend.model.Permiso;
import com.pistache.sprintops_backend.model.Rol;
import com.pistache.sprintops_backend.model.TablaPermisos;
import com.pistache.sprintops_backend.model.TablaPermisos.TablaPermisosId;
import com.pistache.sprintops_backend.service.PermisoService;
import com.pistache.sprintops_backend.service.RolService;
import com.pistache.sprintops_backend.service.ProyectoService;
import com.pistache.sprintops_backend.repository.RolRepository;
import com.pistache.sprintops_backend.repository.TablaPermisosRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/roles")
@CrossOrigin(origins = "*")
public class RolController {

    @Autowired
    private RolService rolService;

    @Autowired
    private PermisoService permisoService;

    @Autowired
    private TablaPermisosRepository tablaPermisosRepository;

    @Autowired
    private ProyectoService proyectoService;

    @Autowired
    private RolRepository rolRepository;

    @GetMapping
    public List<Rol> getAll() {
        return rolService.findAll();
    }

    @GetMapping("/proyecto/{proyectoId}")
    public List<Rol> getByProject(@PathVariable Integer proyectoId) {
        // Return system/base roles + roles scoped to this project only
        List<Rol> baseRoles = rolRepository.findBySistemaTrue();
        List<Rol> projectRoles = rolRepository.findByProyecto_IdProyecto(proyectoId);
        baseRoles.addAll(projectRoles);
        return baseRoles;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Rol> getById(@PathVariable Integer id) {
        return rolService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Rol create(@RequestBody Rol rol) {
        return rolService.save(rol);
    }

    /**
     * Actualiza solo campos enviados. Evita merge de un JSON parcial que pondría {@code proyecto} o {@code sistema} en null.
     */
    @PutMapping("/{id}")
    public ResponseEntity<Rol> update(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        return rolService.findById(id)
                .map(existing -> {
                    Object name = body.get("nombreRol");
                    if (name instanceof String s && !s.isBlank()) {
                        existing.setNombreRol(s.trim());
                    }
                    return ResponseEntity.ok(rolService.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        if (!rolService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        rolService.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/permisos")
    public ResponseEntity<List<Map<String, Object>>> getPermisosByRol(@PathVariable Integer id) {
        if (!rolService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        List<TablaPermisos> entries = tablaPermisosRepository.findByRolIdRol(id);
        List<Map<String, Object>> permisos = entries.stream()
                .map(tp -> Map.<String, Object>of(
                        "idPermiso", tp.getPermiso().getIdPermiso(),
                        "nombrePermiso", tp.getPermiso().getNombrePermiso(),
                        "descripcion", tp.getPermiso().getDescripcionPermisos() != null ? tp.getPermiso().getDescripcionPermisos() : ""
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(permisos);
    }

    @Transactional
    @PutMapping("/{id}/permisos")
    public ResponseEntity<Void> setPermisosByRol(@PathVariable Integer id, @RequestBody List<Integer> permisoIds) {
        if (!rolService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        Rol rol = rolService.findById(id).get();
        List<Integer> ids = permisoIds != null ? permisoIds : List.of();

        // Remove existing permissions for this role
        List<TablaPermisos> existing = tablaPermisosRepository.findByRolIdRol(id);
        tablaPermisosRepository.deleteAll(existing);

        // Add new permissions
        for (Integer permisoId : ids) {
            permisoService.findById(permisoId).ifPresent(permiso -> {
                TablaPermisos tp = new TablaPermisos();
                tp.setId(new TablaPermisosId(id, permisoId));
                tp.setRol(rol);
                tp.setPermiso(permiso);
                tablaPermisosRepository.save(tp);
            });
        }
        return ResponseEntity.ok().build();
    }

    @PostMapping("/with-permisos")
    public ResponseEntity<Map<String, Object>> createWithPermisos(@RequestBody Map<String, Object> body) {
        String nombreRol = (String) body.get("nombreRol");
        @SuppressWarnings("unchecked")
        List<Integer> permisoIds = (List<Integer>) body.get("permisoIds");
        Integer proyectoId = body.get("proyectoId") != null ? ((Number) body.get("proyectoId")).intValue() : null;

        Rol rol = new Rol();
        rol.setNombreRol(nombreRol);
        if (proyectoId != null) {
            proyectoService.findById(proyectoId).ifPresent(rol::setProyecto);
        }
        Rol savedRol = rolService.save(rol);

        if (permisoIds != null) {
            for (Integer permisoId : permisoIds) {
                permisoService.findById(permisoId).ifPresent(permiso -> {
                    TablaPermisos tp = new TablaPermisos();
                    tp.setId(new TablaPermisosId(savedRol.getIdRol(), permisoId));
                    tp.setRol(savedRol);
                    tp.setPermiso(permiso);
                    tablaPermisosRepository.save(tp);
                });
            }
        }

        return ResponseEntity.ok(Map.of(
                "idRol", savedRol.getIdRol(),
                "nombreRol", savedRol.getNombreRol()
        ));
    }
}
