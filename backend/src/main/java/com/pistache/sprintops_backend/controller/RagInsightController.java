package com.pistache.sprintops_backend.controller;

import com.pistache.sprintops_backend.model.RagInsight;
import com.pistache.sprintops_backend.service.springai.RagInsightService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * API REST para indexar y buscar documentos RAG (Reto D4).
 */
@RestController
@RequestMapping("/api/rag")
@CrossOrigin(origins = "*")
public class RagInsightController {

    private final RagInsightService ragInsightService;

    public RagInsightController(RagInsightService ragInsightService) {
        this.ragInsightService = ragInsightService;
    }

    @PostMapping("/insights")
    public ResponseEntity<?> create(@RequestBody CreateRagInsightRequest body) {
        RagInsight saved = ragInsightService.addInsight(
                body.description(),
                body.projectId(),
                body.done() != null && body.done());
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("insight", saved);
        resp.put("vectorIndexed", ragInsightService.isVectorRagAvailable());
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/insights")
    public List<RagInsight> list(@RequestParam(required = false) Integer projectId) {
        return ragInsightService.listByProject(projectId);
    }

    @GetMapping("/search")
    public Map<String, Object> search(
            @RequestParam("q") String query,
            @RequestParam(required = false) Integer projectId,
            @RequestParam(defaultValue = "3") int topK) {
        var hits = ragInsightService.search(query, projectId, topK);
        return Map.of(
                "query", query,
                "vectorSearch", ragInsightService.isVectorRagAvailable(),
                "hits", hits);
    }

    public record CreateRagInsightRequest(String description, Integer projectId, Boolean done) {}
}
