package com.pistache.sprintops_backend.controller;

import com.pistache.sprintops_backend.model.RetroSprint;
import com.pistache.sprintops_backend.service.RetroSprintService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/retro-sprints")
@CrossOrigin(origins = "*")
public class RetroSprintController {

    @Autowired
    private RetroSprintService retroSprintService;

    @GetMapping
    public List<RetroSprint> getAll() {
        return retroSprintService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<RetroSprint> getById(@PathVariable Integer id) {
        return retroSprintService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public RetroSprint create(@RequestBody RetroSprint retroSprint) {
        return retroSprintService.save(retroSprint);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RetroSprint> update(@PathVariable Integer id, @RequestBody RetroSprint retroSprint) {
        if (!retroSprintService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        retroSprint.setIdRetro(id);
        return ResponseEntity.ok(retroSprintService.save(retroSprint));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        if (!retroSprintService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        retroSprintService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
