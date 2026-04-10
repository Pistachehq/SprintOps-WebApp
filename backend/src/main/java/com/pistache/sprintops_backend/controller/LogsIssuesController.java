package com.pistache.sprintops_backend.controller;

import com.pistache.sprintops_backend.model.LogsIssues;
import com.pistache.sprintops_backend.model.Issues;
import com.pistache.sprintops_backend.service.LogsIssuesService;
import com.pistache.sprintops_backend.service.IssuesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/logs-issues")
@CrossOrigin(origins = "*")
public class LogsIssuesController {

    @Autowired
    private LogsIssuesService logsIssuesService;

    @Autowired
    private IssuesService issuesService;

    @GetMapping
    public List<Map<String, Object>> getAll() {
        return logsIssuesService.findAll().stream().map(this::toMap).toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getById(@PathVariable Integer id) {
        return logsIssuesService.findById(id)
                .map(l -> ResponseEntity.ok(toMap(l)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/issue/{issueId}")
    public List<Map<String, Object>> getByIssueId(@PathVariable Integer issueId) {
        return logsIssuesService.findByIssueId(issueId).stream().map(this::toMap).toList();
    }

    @PostMapping
    public Map<String, Object> create(@RequestBody Map<String, Object> request) {
        LogsIssues log = new LogsIssues();
        log.setDescripcionLogIssue((String) request.get("changes"));
        log.setActorLogIssue(String.valueOf(request.get("userId")));
        log.setTipoAccion((String) request.get("action"));
        log.setFechaCreacionLogIssue(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")));

        Integer issueId = (Integer) request.get("issueId");
        if (issueId != null) {
            issuesService.findById(issueId).ifPresent(log::setIssue);
        }

        return toMap(logsIssuesService.save(log));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        if (!logsIssuesService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        logsIssuesService.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private Map<String, Object> toMap(LogsIssues log) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", log.getIdLogissue());
        map.put("issueId", log.getIssue() != null ? log.getIssue().getIdIssue() : null);
        map.put("userId", log.getActorLogIssue());
        map.put("action", log.getTipoAccion());
        map.put("changes", log.getDescripcionLogIssue());
        map.put("createdAt", log.getFechaCreacionLogIssue());
        return map;
    }
}
