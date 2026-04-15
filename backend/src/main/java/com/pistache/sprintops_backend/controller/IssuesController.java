package com.pistache.sprintops_backend.controller;

import com.pistache.sprintops_backend.dto.CreateIssueRequest;
import com.pistache.sprintops_backend.dto.IssueDTO;
import com.pistache.sprintops_backend.dto.MoveToNextSprintRequest;
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
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/issues")
@CrossOrigin(origins = "*")
public class IssuesController {

    private static final String DEFAULT_TAG_COLOR = "#446e51";

    private static final Set<String> ALLOWED_TAG_COLORS = Set.of(
            "#446e51", "#e8702a", "#3b82f6", "#a855f7",
            "#14b8a6", "#f59e0b", "#ec4899", "#8b5cf6",
            "#ef4444", "#06b6d4", "#d97706", "#10b981"
    );

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
        return issuesRepository.findAllBelongingToProject(projectId).stream()
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
        issue.setFechaFinIssue(request.getEndDate());
        applyIssueTags(issue, request.getTagLabel(), request.getTagColor());

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
        if (updates.containsKey("status")) {
            String newStatus = (String) updates.get("status");
            issue.setEstadoIssue(newStatus);
            if ("done".equalsIgnoreCase(newStatus)) {
                issue.setFechaFinIssue(LocalDate.now());
            }
        }
        if (updates.containsKey("endDate")) {
            String endDateStr = (String) updates.get("endDate");
            issue.setFechaFinIssue(endDateStr != null ? LocalDate.parse(endDateStr) : null);
        }
        if (updates.containsKey("priority")) issue.setPrioridadIssue((String) updates.get("priority"));
        if (updates.containsKey("storyPoints")) issue.setStoryPointsIssue((Integer) updates.get("storyPoints"));
        if (updates.containsKey("parentIssueId")) issue.setParentIssueId((Integer) updates.get("parentIssueId"));

        if (updates.containsKey("tagLabel") || updates.containsKey("tagColor")) {
            String label = updates.containsKey("tagLabel")
                    ? (updates.get("tagLabel") == null ? null : String.valueOf(updates.get("tagLabel")))
                    : issue.getTagLabel();
            String color = updates.containsKey("tagColor")
                    ? (updates.get("tagColor") == null ? null : String.valueOf(updates.get("tagColor")))
                    : issue.getTagColor();
            applyIssueTags(issue, label, color);
        }

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

    /**
     * Mueve un issue del sprint origen al sprint destino (mismo proyecto), actualiza estado a todo,
     * incrementa métrica en el sprint origen y registra en logs_issues.
     * Opcional en el body: {@code storyPoints} (número) para acumular deuda con los SP que ve el Kanban.
     */
    @PostMapping("/{issueId}/move-to-next-sprint")
    @Transactional
    public ResponseEntity<IssueDTO> moveToNextSprint(
            @PathVariable Integer issueId,
            @RequestBody MoveToNextSprintRequest req) {
        if (req == null || req.getFromSprintId() == null || req.getToSprintId() == null) {
            return ResponseEntity.badRequest().build();
        }
        int fromSprintId = req.getFromSprintId();
        int toSprintId = req.getToSprintId();
        String username = req.getUsername() != null ? req.getUsername() : "";
        Integer userId = req.getUserId();

        if (fromSprintId == toSprintId) {
            return ResponseEntity.badRequest().build();
        }

        var optIssue = issuesService.findById(issueId);
        if (optIssue.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Issues issue = optIssue.get();

        var optFrom = sprintService.findById(fromSprintId);
        var optTo = sprintService.findById(toSprintId);
        if (optFrom.isEmpty() || optTo.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        Sprint fromSprint = optFrom.get();
        Sprint toSprint = optTo.get();

        if (fromSprint.getProyecto() == null || toSprint.getProyecto() == null
                || !Objects.equals(fromSprint.getProyecto().getIdProyecto(), toSprint.getProyecto().getIdProyecto())) {
            return ResponseEntity.badRequest().build();
        }

        Optional<DescIssue> linkOpt = descIssueRepository.findByIdSprintIdAndIdIssueId(fromSprintId, issueId);
        if (linkOpt.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        int movedPts = storyPointsForMoveToNextSprint(req, issue);
        if ((issue.getStoryPointsIssue() == null || issue.getStoryPointsIssue() == 0) && movedPts > 0) {
            issue.setStoryPointsIssue(movedPts);
        }

        descIssueRepository.delete(linkOpt.get());
        descIssueRepository.findByIdSprintIdAndIdIssueId(toSprintId, issueId).ifPresent(descIssueRepository::delete);

        DescIssue newLink = new DescIssue();
        newLink.setId(new DescIssue.DescIssueId(toSprintId, issueId));
        newLink.setSprint(toSprint);
        newLink.setIssue(issue);
        newLink.setFechaEntrada(LocalDate.now());
        descIssueRepository.save(newLink);

        issue.setEstadoIssue("todo");
        issue.setFechaFinIssue(null);
        issue = issuesService.save(issue);

        int prev = fromSprint.getIssuesEnviadosSiguiente() != null ? fromSprint.getIssuesEnviadosSiguiente() : 0;
        fromSprint.setIssuesEnviadosSiguiente(prev + 1);
        int prevPts =
                fromSprint.getStoryPointsEnviadosSiguiente() != null ? fromSprint.getStoryPointsEnviadosSiguiente() : 0;
        fromSprint.setStoryPointsEnviadosSiguiente(prevPts + movedPts);
        sprintService.save(fromSprint);

        LogsIssues log = new LogsIssues();
        log.setIssue(issue);
        log.setTipoAccion("Traslado a siguiente sprint");
        String destName = toSprint.getNombreSprint() != null ? toSprint.getNombreSprint() : ("#" + toSprintId);
        String actor = userId != null ? String.valueOf(userId) : (username.isEmpty() ? "sistema" : username);
        log.setActorLogIssue(actor);
        String who = !username.isEmpty() ? username : actor;
        log.setDescripcionLogIssue("Enviado al sprint \"" + destName + "\" por " + who);
        log.setFechaCreacionLogIssue(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")));
        logsIssuesService.save(log);

        return ResponseEntity.ok(toDTO(issue, String.valueOf(toSprintId)));
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

    private static String sanitizeTagLabel(String raw) {
        if (raw == null) return null;
        String t = raw.trim();
        if (t.isEmpty()) return null;
        return t.length() > 100 ? t.substring(0, 100) : t;
    }

    private static String normalizeTagColor(String raw) {
        if (raw == null) return null;
        String c = raw.trim().toLowerCase(Locale.ROOT);
        return ALLOWED_TAG_COLORS.contains(c) ? c : null;
    }

    /** Si no hay etiqueta, limpia color. Si hay etiqueta y color inválido, usa el predeterminado. */
    private static void applyIssueTags(Issues issue, String labelRaw, String colorRaw) {
        String label = sanitizeTagLabel(labelRaw);
        if (label == null) {
            issue.setTagLabel(null);
            issue.setTagColor(null);
            return;
        }
        String color = normalizeTagColor(colorRaw);
        issue.setTagLabel(label);
        issue.setTagColor(color != null ? color : DEFAULT_TAG_COLOR);
    }

    /**
     * SP para la métrica de deuda: el Kanban envía {@code storyPoints} para no depender de que la fila
     * en BD esté poblada (evita sumar 0 cuando la tarjeta sí muestra puntos).
     */
    private static int storyPointsForMoveToNextSprint(MoveToNextSprintRequest req, Issues issue) {
        if (req != null && req.getStoryPoints() != null) {
            return Math.max(0, req.getStoryPoints());
        }
        Integer sp = issue.getStoryPointsIssue();
        return sp != null ? sp : 0;
    }
}
