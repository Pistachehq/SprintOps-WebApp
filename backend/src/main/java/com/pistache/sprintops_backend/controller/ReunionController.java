package com.pistache.sprintops_backend.controller;

import com.pistache.sprintops_backend.model.Reunion;
import com.pistache.sprintops_backend.service.ReunionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/reuniones")
@CrossOrigin(origins = "*")
public class ReunionController {

    @Autowired
    private ReunionService reunionService;

    @GetMapping
    public List<Reunion> getAll() {
        return reunionService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Reunion> getById(@PathVariable Integer id) {
        return reunionService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Reunion create(@RequestBody Reunion reunion) {
        return reunionService.save(reunion);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Reunion> update(@PathVariable Integer id, @RequestBody Reunion reunion) {
        if (!reunionService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        reunion.setIdReunion(id);
        return ResponseEntity.ok(reunionService.save(reunion));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        if (!reunionService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        reunionService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
