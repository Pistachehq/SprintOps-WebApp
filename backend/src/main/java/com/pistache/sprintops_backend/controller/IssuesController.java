package com.pistache.sprintops_backend.controller;

import com.pistache.sprintops_backend.dto.CreateIssueRequest;
import com.pistache.sprintops_backend.dto.IssueDTO;
import com.pistache.sprintops_backend.model.*;
import com.pistache.sprintops_backend.service.IssuesService;
import com.pistache.sprintops_backend.service.ProyectoService;
import com.pistache.sprintops_backend.service.SprintService;
import com.pistache.sprintops_backend.service.UsuarioService;
import com.pistache.sprintops_backend.repository.AsignacionIssuesRepository;
import com.pistache.sprintops_backend.repository.DescIssueRepository;
import com.pistache.sprintops_backend.repository.IssuesRepository;
import com.pistache.sprintops_backend.repository.LogsIssuesRepository;
import com.pistache.sprintops_backend.repository.PapeleraIssueRepository;
import com.pistache.sprintops_backend.service.LogsIssuesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/issues")
@CrossOrigin(origins = "*")
public class IssuesController {

    @Autowired
    private IssuesService issuesService;
    @Autowired
    private ProyectoService proyectoService;
    @Autowired
    private SprintService sprintService;
    @Autowired
    private UsuarioService usuarioService;
    @Autowired
    private AsignacionIssuesRepository asignacionIssuesRepository;
    @Autowired
    private DescIssueRepository descIssueRepository;
    @Autowired
    private IssuesRepository issuesRepository;
    @Autowired
    private LogsIssuesRepository logsIssuesRepository;
    @Autowired
    private PapeleraIssueRepository papeleraIssueRepository;
    @Autowired
    private LogsIssuesService logsIssuesService;

    @GetMapping
    public List<IssueDTO> getAll() {
        return issuesService.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<IssueDTO> getById(@PathVariable Integer id) {
        return issuesService.findById(id)
                .map(i -> ResponseEntity.ok(toDTO(i)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/proyecto/{projectId}")
    public List<IssueDTO> getByProjectId(@PathVariable Integer projectId) {
        return issuesRepository.findByProyectoIdProyecto(projectId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/sprint/{sprintId}")
    public List<IssueDTO> getBySprintId(@PathVariable Integer sprintId) {
        // Issues linked to sprint via desc_issue table
        List<DescIssue> descs = descIssueRepository.findBySprintIdSprint(sprintId);
        return descs.stream()
                .map(d -> toDTO(d.getIssue(), String.valueOf(sprintId)))
                .collect(Collectors.toList());
    }

    @PostMapping
    public ResponseEntity<IssueDTO> create(@RequestBody CreateIssueRequest request) {
        Issues issue = new Issues();
        issue.setTituloIssue(request.getTitle());
        issue.setDescripcionIssue(request.getDescription());
        issue.setPropositoIssue(request.getPurpose());
        issue.setEstadoIssue(request.getStatus() != null ? request.getStatus() : "todo");
        issue.setPrioridadIssue(request.getPriority() != null ? request.getPriority() : "Medium");
        issue.setStoryPointsIssue(request.getStoryPoints() != null ? request.getStoryPoints() : 0);
        issue.setParentIssueId(request.getParentIssueId());
        issue.setFechaCreacionIssue(LocalDate.now());

        if (request.getProjectId() != null) {
            proyectoService.findById(request.getProjectId()).ifPresent(issue::setProyecto);
        }

        // Link to sprint via desc_issue, and derive project from sprint if not set
        Sprint linkedSprint = null;
        if (request.getSprintId() != null) {
            try {
                Integer sprintId = Integer.parseInt(request.getSprintId());
                var optSprint = sprintService.findById(sprintId);
                if (optSprint.isPresent()) {
                    linkedSprint = optSprint.get();
                    if (issue.getProyecto() == null && linkedSprint.getProyecto() != null) {
                        issue.setProyecto(linkedSprint.getProyecto());
                    }
                }
            } catch (NumberFormatException ignored) {}
        }

        issue = issuesService.save(issue);

        if (linkedSprint != null) {
            DescIssue desc = new DescIssue();
            desc.setId(new DescIssue.DescIssueId(linkedSprint.getIdSprint(), issue.getIdIssue()));
            desc.setSprint(linkedSprint);
            desc.setIssue(issue);
            desc.setFechaEntrada(LocalDate.now());
            descIssueRepository.save(desc);
        }

        // Assign to users
        if (request.getAssigneeIds() != null) {
            for (Integer assigneeId : request.getAssigneeIds()) {
                var optUser = usuarioService.findById(assigneeId);
                if (optUser.isPresent()) {
                    AsignacionIssues asig = new AsignacionIssues();
                    asig.setId(new AsignacionIssues.AsignacionIssuesId(assigneeId, issue.getIdIssue()));
                    asig.setUsuario(optUser.get());
                    asig.setIssue(issue);
                    asignacionIssuesRepository.save(asig);
                }
            }
        }

        return ResponseEntity.ok(toDTO(issue, request.getSprintId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<IssueDTO> update(@PathVariable Integer id, @RequestBody Map<String, Object> updates) {
        var optIssue = issuesService.findById(id);
        if (optIssue.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Issues issue = optIssue.get();

        if (updates.containsKey("title")) issue.setTituloIssue((String) updates.get("title"));
        if (updates.containsKey("description")) issue.setDescripcionIssue((String) updates.get("description"));
        if (updates.containsKey("purpose")) issue.setPropositoIssue((String) updates.get("purpose"));
        if (updates.containsKey("status")) issue.setEstadoIssue((String) updates.get("status"));
        if (updates.containsKey("priority")) issue.setPrioridadIssue((String) updates.get("priority"));
        if (updates.containsKey("storyPoints")) issue.setStoryPointsIssue((Integer) updates.get("storyPoints"));
        if (updates.containsKey("parentIssueId")) issue.setParentIssueId((Integer) updates.get("parentIssueId"));

        issue = issuesService.save(issue);

        // Update assignees if provided
        if (updates.containsKey("assigneeIds")) {
            // Remove existing assignments
            List<AsignacionIssues> existing = asignacionIssuesRepository.findByIssueIdIssue(id);
            asignacionIssuesRepository.deleteAll(existing);

            // Add new assignments
            @SuppressWarnings("unchecked")
            List<Integer> newAssigneeIds = (List<Integer>) updates.get("assigneeIds");
            if (newAssigneeIds != null) {
                for (Integer assigneeId : newAssigneeIds) {
                    var optUser = usuarioService.findById(assigneeId);
                    if (optUser.isPresent()) {
                        AsignacionIssues asig = new AsignacionIssues();
                        asig.setId(new AsignacionIssues.AsignacionIssuesId(assigneeId, issue.getIdIssue()));
                        asig.setUsuario(optUser.get());
                        asig.setIssue(issue);
                        asignacionIssuesRepository.save(asig);
                    }
                }
            }
        }

        return ResponseEntity.ok(toDTO(issue));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        var optIssue = issuesService.findById(id);
        if (optIssue.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Issues issue = optIssue.get();

        List<DescIssue> descs = descIssueRepository.findByIssueIdIssue(id);
        Integer sprintId = descs.isEmpty() ? null : descs.get(0).getSprint().getIdSprint();

        PapeleraIssue trashed = new PapeleraIssue();
        trashed.setOriginalIssueId(issue.getIdIssue());
        trashed.setSprintId(sprintId);
        trashed.setProyectoId(issue.getProyecto() != null ? issue.getProyecto().getIdProyecto() : null);
        trashed.setTitulo(issue.getTituloIssue());
        trashed.setDescripcion(issue.getDescripcionIssue());
        trashed.setProposito(issue.getPropositoIssue());
        trashed.setEstado(issue.getEstadoIssue());
        trashed.setPrioridad(issue.getPrioridadIssue());
        trashed.setStoryPoints(issue.getStoryPointsIssue());
        trashed.setParentIssueId(issue.getParentIssueId());
        trashed.setFechaCreacionIssue(issue.getFechaCreacionIssue());
        trashed.setFechaBorrado(LocalDateTime.now());
        papeleraIssueRepository.save(trashed);

        asignacionIssuesRepository.deleteAll(asignacionIssuesRepository.findByIssueIdIssue(id));
        descIssueRepository.deleteAll(descs);
        logsIssuesRepository.deleteAll(logsIssuesRepository.findByIssueIdIssue(id));
        issuesService.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private IssueDTO toDTO(Issues issue) {
        return toDTO(issue, null);
    }

    private IssueDTO toDTO(Issues issue, String sprintIdOverride) {
        List<Integer> assigneeIds = asignacionIssuesRepository.findByIssueIdIssue(issue.getIdIssue())
                .stream().map(a -> a.getUsuario().getIdUsuario())
                .collect(Collectors.toList());

        String sprintId = sprintIdOverride;
        if (sprintId == null) {
            List<DescIssue> descs = descIssueRepository.findByIssueIdIssue(issue.getIdIssue());
            if (!descs.isEmpty()) {
                sprintId = String.valueOf(descs.get(0).getSprint().getIdSprint());
            }
        }

        return IssueDTO.fromEntity(issue, assigneeIds, sprintId);
    }
}
