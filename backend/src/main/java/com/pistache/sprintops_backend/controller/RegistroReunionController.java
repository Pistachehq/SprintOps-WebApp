package com.pistache.sprintops_backend.controller;

import com.pistache.sprintops_backend.model.RegistroReunion;
import com.pistache.sprintops_backend.service.RegistroReunionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/registros-reunion")
@CrossOrigin(origins = "*")
public class RegistroReunionController {

    @Autowired
    private RegistroReunionService registroReunionService;

    @GetMapping
    public List<RegistroReunion> getAll() {
        return registroReunionService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<RegistroReunion> getById(@PathVariable Integer id) {
        return registroReunionService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public RegistroReunion create(@RequestBody RegistroReunion registroReunion) {
        return registroReunionService.save(registroReunion);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RegistroReunion> update(@PathVariable Integer id, @RequestBody RegistroReunion registroReunion) {
        if (!registroReunionService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        registroReunion.setIdRegistro(id);
        return ResponseEntity.ok(registroReunionService.save(registroReunion));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        if (!registroReunionService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        registroReunionService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
