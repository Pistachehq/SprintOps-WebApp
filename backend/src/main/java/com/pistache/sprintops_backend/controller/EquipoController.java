package com.pistache.sprintops_backend.controller;

import com.pistache.sprintops_backend.model.Equipo;
import com.pistache.sprintops_backend.service.EquipoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/equipos")
@CrossOrigin(origins = "*")
public class EquipoController {

    @Autowired
    private EquipoService equipoService;

    @GetMapping
    public List<Equipo> getAll() {
        return equipoService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Equipo> getById(@PathVariable Integer id) {
        return equipoService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Equipo create(@RequestBody Equipo equipo) {
        return equipoService.save(equipo);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Equipo> update(@PathVariable Integer id, @RequestBody Equipo equipo) {
        if (!equipoService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        equipo.setIdEquipo(id);
        return ResponseEntity.ok(equipoService.save(equipo));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        if (!equipoService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        equipoService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
