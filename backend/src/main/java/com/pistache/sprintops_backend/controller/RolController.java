package com.pistache.sprintops_backend.controller;

import com.pistache.sprintops_backend.model.Rol;
import com.pistache.sprintops_backend.service.RolService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/roles")
@CrossOrigin(origins = "*")
public class RolController {

    @Autowired
    private RolService rolService;

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
}
