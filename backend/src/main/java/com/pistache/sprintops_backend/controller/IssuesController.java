package com.pistache.sprintops_backend.controller;

import com.pistache.sprintops_backend.model.Issues;
import com.pistache.sprintops_backend.service.IssuesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/issues")
@CrossOrigin(origins = "*")
public class IssuesController {

    @Autowired
    private IssuesService issuesService;

    @GetMapping
    public List<Issues> getAll() {
        return issuesService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Issues> getById(@PathVariable Integer id) {
        return issuesService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Issues create(@RequestBody Issues issues) {
        return issuesService.save(issues);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Issues> update(@PathVariable Integer id, @RequestBody Issues issues) {
        if (!issuesService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        issues.setIdIssue(id);
        return ResponseEntity.ok(issuesService.save(issues));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        if (!issuesService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        issuesService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
