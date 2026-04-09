package com.pistache.sprintops_backend.controller;

import com.pistache.sprintops_backend.model.Metodologia;
import com.pistache.sprintops_backend.service.MetodologiaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/metodologias")
@CrossOrigin(origins = "*")
public class MetodologiaController {

    @Autowired
    private MetodologiaService metodologiaService;

    @GetMapping
    public List<Metodologia> getAll() {
        return metodologiaService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Metodologia> getById(@PathVariable Integer id) {
        return metodologiaService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Metodologia create(@RequestBody Metodologia metodologia) {
        return metodologiaService.save(metodologia);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Metodologia> update(@PathVariable Integer id, @RequestBody Metodologia metodologia) {
        if (!metodologiaService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        metodologia.setIdMetodologia(id);
        return ResponseEntity.ok(metodologiaService.save(metodologia));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        if (!metodologiaService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        metodologiaService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
