package com.pistache.sprintops_backend.controller;

import com.pistache.sprintops_backend.model.Permiso;
import com.pistache.sprintops_backend.model.Rol;
import com.pistache.sprintops_backend.model.TablaPermisos;
import com.pistache.sprintops_backend.model.TablaPermisos.TablaPermisosId;
import com.pistache.sprintops_backend.service.PermisoService;
import com.pistache.sprintops_backend.service.RolService;
import com.pistache.sprintops_backend.repository.TablaPermisosRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
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

    @GetMapping
    public List<Rol> getAll() {
        return rolService.findAll();
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

    @PutMapping("/{id}")
    public ResponseEntity<Rol> update(@PathVariable Integer id, @RequestBody Rol rol) {
        if (!rolService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        rol.setIdRol(id);
        return ResponseEntity.ok(rolService.save(rol));
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

    @PutMapping("/{id}/permisos")
    public ResponseEntity<Void> setPermisosByRol(@PathVariable Integer id, @RequestBody List<Integer> permisoIds) {
        if (!rolService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        Rol rol = rolService.findById(id).get();

        // Remove existing permissions for this role
        List<TablaPermisos> existing = tablaPermisosRepository.findByRolIdRol(id);
        tablaPermisosRepository.deleteAll(existing);

        // Add new permissions
        for (Integer permisoId : permisoIds) {
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

        Rol rol = new Rol();
        rol.setNombreRol(nombreRol);
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
