package com.pistache.sprintops_backend.controller;

import com.pistache.sprintops_backend.model.Sprint;
import com.pistache.sprintops_backend.service.SprintService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/sprints")
@CrossOrigin(origins = "*")
public class SprintController {

    @Autowired
    private SprintService sprintService;

    @GetMapping
    public List<Sprint> getAll() {
        return sprintService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Sprint> getById(@PathVariable Integer id) {
        return sprintService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Sprint create(@RequestBody Sprint sprint) {
        return sprintService.save(sprint);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Sprint> update(@PathVariable Integer id, @RequestBody Sprint sprint) {
        if (!sprintService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        sprint.setIdSprint(id);
        return ResponseEntity.ok(sprintService.save(sprint));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        if (!sprintService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        sprintService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
