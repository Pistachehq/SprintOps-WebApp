package com.pistache.sprintops_backend.controller;

import com.pistache.sprintops_backend.model.RetroItem;
import com.pistache.sprintops_backend.service.RetroItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/retro-items")
@CrossOrigin(origins = "*")
public class RetroItemController {

    @Autowired
    private RetroItemService retroItemService;

    @GetMapping
    public List<RetroItem> getAll() {
        return retroItemService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<RetroItem> getById(@PathVariable Integer id) {
        return retroItemService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public RetroItem create(@RequestBody RetroItem retroItem) {
        return retroItemService.save(retroItem);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RetroItem> update(@PathVariable Integer id, @RequestBody RetroItem retroItem) {
        if (!retroItemService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        retroItem.setIdItem(id);
        return ResponseEntity.ok(retroItemService.save(retroItem));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        if (!retroItemService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        retroItemService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
