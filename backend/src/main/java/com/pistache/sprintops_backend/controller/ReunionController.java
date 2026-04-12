package com.pistache.sprintops_backend.controller;

import com.pistache.sprintops_backend.model.Reunion;
import com.pistache.sprintops_backend.model.RegistroReunion;
import com.pistache.sprintops_backend.repository.ReunionRepository;
import com.pistache.sprintops_backend.repository.RegistroReunionRepository;
import com.pistache.sprintops_backend.service.ReunionService;
import com.pistache.sprintops_backend.service.SprintService;
import com.pistache.sprintops_backend.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reuniones")
@CrossOrigin(origins = "*")
public class ReunionController {

    @Autowired
    private ReunionService reunionService;
    @Autowired
    private ReunionRepository reunionRepository;
    @Autowired
    private RegistroReunionRepository registroReunionRepository;
    @Autowired
    private SprintService sprintService;
    @Autowired
    private UsuarioService usuarioService;

    @GetMapping
    public List<Reunion> getAll() {
        return reunionService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Reunion> getById(@PathVariable Integer id) {
        return reunionService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/sprint/{sprintId}")
    public List<Map<String, Object>> getBySprintId(@PathVariable Integer sprintId) {
        return reunionRepository.findBySprintIdSprintOrderByFechaDeReunionDesc(sprintId).stream()
                .map(r -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", r.getIdReunion());
                    map.put("type", r.getTipoReunion());
                    map.put("date", r.getFechaDeReunion().toString());
                    map.put("sprintId", sprintId);
                    return map;
                })
                .collect(Collectors.toList());
    }

    @PostMapping("/daily")
    public ResponseEntity<Map<String, Object>> getOrCreateDaily(@RequestBody Map<String, Object> body) {
        Integer sprintId = (Integer) body.get("sprintId");
        Integer userId = (Integer) body.get("userId");
        if (sprintId == null || userId == null) {
            return ResponseEntity.badRequest().build();
        }

        LocalDate today = LocalDate.now();

        Reunion reunion = reunionRepository
                .findBySprintIdSprintAndFechaDeReunionAndTipoReunion(sprintId, today, "Daily")
                .orElseGet(() -> {
                    var optSprint = sprintService.findById(sprintId);
                    if (optSprint.isEmpty()) return null;
                    Reunion r = new Reunion();
                    r.setTipoReunion("Daily");
                    r.setFechaDeReunion(today);
                    r.setSprint(optSprint.get());
                    return reunionService.save(r);
                });

        if (reunion == null) {
            return ResponseEntity.notFound().build();
        }

        Optional<RegistroReunion> existingRegistro = registroReunionRepository
                .findByReunionIdReunionAndUsuarioIdUsuario(reunion.getIdReunion(), userId);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("reunionId", reunion.getIdReunion());
        result.put("date", reunion.getFechaDeReunion().toString());

        if (existingRegistro.isPresent()) {
            RegistroReunion reg = existingRegistro.get();
            result.put("registroId", reg.getIdRegistro());
            result.put("done", reg.getQueHice());
            result.put("doing", reg.getQueHare());
            result.put("blockers", reg.getImpedimentos());
        } else {
            result.put("registroId", null);
            result.put("done", "");
            result.put("doing", "");
            result.put("blockers", "");
        }

        return ResponseEntity.ok(result);
    }

    @PostMapping("/daily/save")
    public ResponseEntity<Map<String, Object>> saveDaily(@RequestBody Map<String, Object> body) {
        Integer reunionId = (Integer) body.get("reunionId");
        Integer userId = (Integer) body.get("userId");
        String done = (String) body.get("done");
        String doing = (String) body.get("doing");
        String blockers = (String) body.get("blockers");

        if (reunionId == null || userId == null) {
            return ResponseEntity.badRequest().build();
        }

        var optReunion = reunionService.findById(reunionId);
        var optUser = usuarioService.findById(userId);
        if (optReunion.isEmpty() || optUser.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        RegistroReunion registro = registroReunionRepository
                .findByReunionIdReunionAndUsuarioIdUsuario(reunionId, userId)
                .orElse(new RegistroReunion());

        registro.setQueHice(done != null ? done : "");
        registro.setQueHare(doing != null ? doing : "");
        registro.setImpedimentos(blockers != null ? blockers : "");
        registro.setReunion(optReunion.get());
        registro.setUsuario(optUser.get());

        registro = registroReunionRepository.save(registro);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("registroId", registro.getIdRegistro());
        result.put("reunionId", reunionId);
        result.put("date", optReunion.get().getFechaDeReunion().toString());
        result.put("done", registro.getQueHice());
        result.put("doing", registro.getQueHare());
        result.put("blockers", registro.getImpedimentos());

        return ResponseEntity.ok(result);
    }

    @PostMapping
    public Reunion create(@RequestBody Reunion reunion) {
        return reunionService.save(reunion);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        if (!reunionService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        reunionService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
