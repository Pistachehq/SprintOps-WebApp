package com.pistache.sprintops_backend.controller;

import com.pistache.sprintops_backend.model.Metrica;
import com.pistache.sprintops_backend.service.MetricaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/metricas")
@CrossOrigin(origins = "*")
public class MetricaController {

    @Autowired
    private MetricaService metricaService;

    @GetMapping
    public List<Metrica> getAll() {
        return metricaService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Metrica> getById(@PathVariable Integer id) {
        return metricaService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Metrica create(@RequestBody Metrica metrica) {
        return metricaService.save(metrica);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Metrica> update(@PathVariable Integer id, @RequestBody Metrica metrica) {
        if (!metricaService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        metrica.setIdMetrica(id);
        return ResponseEntity.ok(metricaService.save(metrica));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        if (!metricaService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        metricaService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
