package com.pistache.sprintops_backend.controller;

import com.pistache.sprintops_backend.dto.CreateSprintRequest;
import com.pistache.sprintops_backend.dto.SprintDTO;
import com.pistache.sprintops_backend.model.Sprint;
import com.pistache.sprintops_backend.model.Proyecto;
import com.pistache.sprintops_backend.service.SprintService;
import com.pistache.sprintops_backend.service.ProyectoService;
import com.pistache.sprintops_backend.repository.SprintRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/sprints")
@CrossOrigin(origins = "*")
public class SprintController {

    @Autowired
    private SprintService sprintService;
    @Autowired
    private ProyectoService proyectoService;
    @Autowired
    private SprintRepository sprintRepository;

    @GetMapping
    public List<SprintDTO> getAll() {
        return sprintService.findAll().stream()
                .map(SprintDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SprintDTO> getById(@PathVariable Integer id) {
        return sprintService.findById(id)
                .map(s -> ResponseEntity.ok(SprintDTO.fromEntity(s)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/proyecto/{projectId}")
    public List<SprintDTO> getByProjectId(@PathVariable Integer projectId) {
        return sprintRepository.findByProyectoIdProyecto(projectId).stream()
                .map(SprintDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @PostMapping
    public ResponseEntity<SprintDTO> create(@RequestBody CreateSprintRequest request) {
        var optProyecto = proyectoService.findById(request.getProjectId());
        if (optProyecto.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        Sprint sprint = new Sprint();
        sprint.setNombreSprint(request.getName());
        sprint.setObjetivoSprint(request.getGoal());
        sprint.setEstadoDelSprint(request.getStatus() != null ? request.getStatus() : "P");
        sprint.setFechaInicioSprint(request.getStartDate());
        sprint.setFechaFinSprint(request.getEndDate());
        sprint.setCapacidadStoryPoints(request.getCapacity());
        sprint.setProyecto(optProyecto.get());

        return ResponseEntity.ok(SprintDTO.fromEntity(sprintService.save(sprint)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SprintDTO> update(@PathVariable Integer id, @RequestBody Map<String, Object> updates) {
        var optSprint = sprintService.findById(id);
        if (optSprint.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Sprint sprint = optSprint.get();

        if (updates.containsKey("name")) sprint.setNombreSprint((String) updates.get("name"));
        if (updates.containsKey("goal")) sprint.setObjetivoSprint((String) updates.get("goal"));
        if (updates.containsKey("status")) sprint.setEstadoDelSprint((String) updates.get("status"));
        if (updates.containsKey("startDate")) sprint.setFechaInicioSprint(LocalDate.parse((String) updates.get("startDate")));
        if (updates.containsKey("endDate")) sprint.setFechaFinSprint(LocalDate.parse((String) updates.get("endDate")));
        if (updates.containsKey("capacity")) sprint.setCapacidadStoryPoints(updates.get("capacity") != null ? ((Number) updates.get("capacity")).intValue() : null);

        return ResponseEntity.ok(SprintDTO.fromEntity(sprintService.save(sprint)));
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
