package com.pistache.sprintops_backend.controller;

import com.pistache.sprintops_backend.model.Proyecto;
import com.pistache.sprintops_backend.service.ProyectoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/proyectos")
@CrossOrigin(origins = "*")
public class ProyectoController {

    @Autowired
    private ProyectoService proyectoService;

    @GetMapping
    public List<Proyecto> getAll() {
        return proyectoService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Proyecto> getById(@PathVariable Integer id) {
        return proyectoService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Proyecto create(@RequestBody Proyecto proyecto) {
        return proyectoService.save(proyecto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Proyecto> update(@PathVariable Integer id, @RequestBody Proyecto proyecto) {
        if (!proyectoService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        proyecto.setIdProyecto(id);
        return ResponseEntity.ok(proyectoService.save(proyecto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        if (!proyectoService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        proyectoService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
