package com.pistache.sprintops_backend.controller;

import com.pistache.sprintops_backend.dto.ProyectoDTO;
import com.pistache.sprintops_backend.service.TiempoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class TiempoController {

    @Autowired
    private TiempoService tiempoService;

    @GetMapping("/proyectos/{id}/tiempo")
    public ResponseEntity<?> reporte(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(tiempoService.reporte(id));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/tiempo/issue/{issueId}")
    public List<Map<String, Object>> logs(@PathVariable Integer issueId) {
        return tiempoService.logsDeIssue(issueId);
    }

    @PostMapping("/tiempo")
    public ResponseEntity<?> registrar(@RequestBody Map<String, Object> body) {
        try {
            Integer issueId = intValue(body.get("issueId"));
            Integer userId = intValue(body.get("userId"));
            BigDecimal horas = body.get("horas") == null ? null : new BigDecimal(String.valueOf(body.get("horas")));
            LocalDate fecha = body.get("fecha") == null || String.valueOf(body.get("fecha")).isBlank()
                    ? LocalDate.now()
                    : LocalDate.parse(String.valueOf(body.get("fecha")));
            String nota = body.get("nota") == null ? null : String.valueOf(body.get("nota"));
            return ResponseEntity.ok(tiempoService.registrar(issueId, userId, horas, fecha, nota));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PutMapping("/proyectos/{id}/cotizacion")
    public ResponseEntity<?> cotizacion(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        try {
            BigDecimal tarifa = body.get("tarifaHora") == null || String.valueOf(body.get("tarifaHora")).isBlank()
                    ? null
                    : new BigDecimal(String.valueOf(body.get("tarifaHora")));
            BigDecimal margen = body.get("margenUtilidad") == null || String.valueOf(body.get("margenUtilidad")).isBlank()
                    ? null
                    : new BigDecimal(String.valueOf(body.get("margenUtilidad")));
            return ResponseEntity.ok(ProyectoDTO.fromEntity(tiempoService.actualizarCotizacion(id, tarifa, margen)));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    private static Integer intValue(Object raw) {
        if (raw == null) return null;
        return Integer.valueOf(String.valueOf(raw));
    }
}
