package com.pistache.sprintops_backend.controller;

import com.pistache.sprintops_backend.dto.PapeleraIssueDTO;
import com.pistache.sprintops_backend.model.*;
import com.pistache.sprintops_backend.repository.DescIssueRepository;
import com.pistache.sprintops_backend.repository.PapeleraIssueRepository;
import com.pistache.sprintops_backend.service.IssuesService;
import com.pistache.sprintops_backend.service.LogsIssuesService;
import com.pistache.sprintops_backend.service.ProyectoService;
import com.pistache.sprintops_backend.service.SprintService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/papelera")
@CrossOrigin(origins = "*")
public class PapeleraController {

    @Autowired
    private PapeleraIssueRepository papeleraRepository;
    @Autowired
    private IssuesService issuesService;
    @Autowired
    private SprintService sprintService;
    @Autowired
    private ProyectoService proyectoService;
    @Autowired
    private DescIssueRepository descIssueRepository;
    @Autowired
    private LogsIssuesService logsIssuesService;

    @GetMapping("/sprint/{sprintId}")
    public List<PapeleraIssueDTO> getBySprintId(@PathVariable Integer sprintId) {
        return papeleraRepository.findBySprintIdOrderByFechaBorradoDesc(sprintId).stream()
                .map(PapeleraIssueDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @PostMapping("/restore/{id}")
    public ResponseEntity<?> restore(@PathVariable Integer id) {
        var optTrash = papeleraRepository.findById(id);
        if (optTrash.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        PapeleraIssue trashed = optTrash.get();

        Issues issue = new Issues();
        issue.setTituloIssue(trashed.getTitulo());
        issue.setDescripcionIssue(trashed.getDescripcion());
        issue.setPropositoIssue(trashed.getProposito());
        issue.setEstadoIssue(trashed.getEstado());
        issue.setPrioridadIssue(trashed.getPrioridad());
        issue.setStoryPointsIssue(trashed.getStoryPoints());
        issue.setParentIssueId(trashed.getParentIssueId());
        issue.setFechaCreacionIssue(trashed.getFechaCreacionIssue() != null ? trashed.getFechaCreacionIssue() : LocalDate.now());

        if (trashed.getProyectoId() != null) {
            proyectoService.findById(trashed.getProyectoId()).ifPresent(issue::setProyecto);
        }

        Sprint linkedSprint = null;
        if (trashed.getSprintId() != null) {
            var optSprint = sprintService.findById(trashed.getSprintId());
            if (optSprint.isPresent()) {
                linkedSprint = optSprint.get();
                if (issue.getProyecto() == null && linkedSprint.getProyecto() != null) {
                    issue.setProyecto(linkedSprint.getProyecto());
                }
            }
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

        LogsIssues logDelete = new LogsIssues();
        logDelete.setTipoAccion("Enviado a papelera");
        logDelete.setDescripcionLogIssue("Issue eliminado y enviado a la papelera del sprint");
        logDelete.setActorLogIssue("Sistema");
        logDelete.setFechaCreacionLogIssue(trashed.getFechaBorrado().format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")));
        logDelete.setIssue(issue);
        logsIssuesService.save(logDelete);

        LogsIssues logRestore = new LogsIssues();
        logRestore.setTipoAccion("Restaurado desde papelera");
        logRestore.setDescripcionLogIssue("Issue restaurado desde la papelera del sprint");
        logRestore.setActorLogIssue("Sistema");
        logRestore.setFechaCreacionLogIssue(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")));
        logRestore.setIssue(issue);
        logsIssuesService.save(logRestore);

        papeleraRepository.deleteById(id);

        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePermanently(@PathVariable Integer id) {
        if (!papeleraRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        papeleraRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
