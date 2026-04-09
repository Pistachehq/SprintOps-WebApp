package com.pistache.sprintops_backend.controller;

import com.pistache.sprintops_backend.model.LogsIssues;
import com.pistache.sprintops_backend.service.LogsIssuesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/logs-issues")
@CrossOrigin(origins = "*")
public class LogsIssuesController {

    @Autowired
    private LogsIssuesService logsIssuesService;

    @GetMapping
    public List<LogsIssues> getAll() {
        return logsIssuesService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<LogsIssues> getById(@PathVariable Integer id) {
        return logsIssuesService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public LogsIssues create(@RequestBody LogsIssues logsIssues) {
        return logsIssuesService.save(logsIssues);
    }

    @PutMapping("/{id}")
    public ResponseEntity<LogsIssues> update(@PathVariable Integer id, @RequestBody LogsIssues logsIssues) {
        if (!logsIssuesService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        logsIssues.setIdLogissue(id);
        return ResponseEntity.ok(logsIssuesService.save(logsIssues));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        if (!logsIssuesService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        logsIssuesService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
