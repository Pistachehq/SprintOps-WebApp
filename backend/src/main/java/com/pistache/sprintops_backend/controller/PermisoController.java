package com.pistache.sprintops_backend.controller;

import com.pistache.sprintops_backend.model.Permiso;
import com.pistache.sprintops_backend.service.PermisoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/permisos")
@CrossOrigin(origins = "*")
public class PermisoController {

    @Autowired
    private PermisoService permisoService;

    @GetMapping
    public List<Permiso> getAll() {
        return permisoService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Permiso> getById(@PathVariable Integer id) {
        return permisoService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Permiso create(@RequestBody Permiso permiso) {
        return permisoService.save(permiso);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Permiso> update(@PathVariable Integer id, @RequestBody Permiso permiso) {
        if (!permisoService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        permiso.setIdPermiso(id);
        return ResponseEntity.ok(permisoService.save(permiso));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        if (!permisoService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        permisoService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
