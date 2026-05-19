package com.pistache.sprintops_backend.service;

import com.pistache.sprintops_backend.dto.DeveloperSprintKpisDTO;
import com.pistache.sprintops_backend.model.DescIssue;
import com.pistache.sprintops_backend.model.InfoUsuarioEquipo.InfoUsuarioEquipoId;
import com.pistache.sprintops_backend.model.Issues;
import com.pistache.sprintops_backend.model.Proyecto;
import com.pistache.sprintops_backend.repository.AsignacionIssuesRepository;
import com.pistache.sprintops_backend.repository.DescIssueRepository;
import com.pistache.sprintops_backend.repository.InfoUsuarioEquipoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@Service
public class DeveloperSprintKpisService {

    @Autowired
    private SprintService sprintService;
    @Autowired
    private ProyectoService proyectoService;
    @Autowired
    private DescIssueRepository descIssueRepository;
    @Autowired
    private AsignacionIssuesRepository asignacionIssuesRepository;
    @Autowired
    private InfoUsuarioEquipoRepository infoUsuarioEquipoRepository;
    @Autowired
    private ProyectoPermissionCheckService permissionCheckService;

    public DeveloperSprintKpisDTO compute(
            Integer sprintId,
            Integer developerUserId,
            Integer viewerUserId) {
        if (sprintId == null || developerUserId == null || viewerUserId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Faltan parámetros obligatorios");
        }

        var sprintOpt = sprintService.findById(sprintId);
        if (sprintOpt.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Sprint no encontrado");
        }
        var sprint = sprintOpt.get();
        Proyecto proyecto = sprint.getProyecto();
        if (proyecto == null || proyecto.getEquipo() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sprint sin proyecto válido");
        }
        Integer projectId = proyecto.getIdProyecto();
        Integer equipoId = proyecto.getEquipo().getIdEquipo();

        if (!isEquipoMember(equipoId, viewerUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El usuario solicitante no pertenece al equipo del proyecto");
        }
        if (!isEquipoMember(equipoId, developerUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El desarrollador indicado no pertenece al equipo del proyecto");
        }

        boolean viewingSelf = viewerUserId.equals(developerUserId);
        boolean canSeeOthers = permissionCheckService.memberHasPermission(viewerUserId, projectId, "canViewAllIssues")
                || permissionCheckService.memberHasPermission(viewerUserId, projectId, "canViewMetrics");
        if (!viewingSelf && !canSeeOthers) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permiso para ver KPIs de otros integrantes");
        }
        if (viewingSelf) {
            boolean canSeeOwn = permissionCheckService.memberHasPermission(viewerUserId, projectId, "canViewOnlyOwnIssues")
                    || permissionCheckService.memberHasPermission(viewerUserId, projectId, "canViewAllIssues");
            if (!canSeeOwn) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permiso para ver issues en este proyecto");
            }
        }

        List<DescIssue> descs = descIssueRepository.findBySprintIdSprint(sprintId);

        int countTodo = 0;
        int countInProgress = 0;
        int countDone = 0;
        int countBlocked = 0;
        double spTodo = 0;
        double spInProgress = 0;
        double spDone = 0;
        double spBlocked = 0;
        int issuesAssigned = 0;

        for (DescIssue d : descs) {
            Issues issue = d.getIssue();
            if (issue == null) {
                continue;
            }
            List<Integer> assigneeIds = asignacionIssuesRepository.findByIssueIdIssue(issue.getIdIssue()).stream()
                    .map(a -> a.getUsuario().getIdUsuario())
                    .toList();
            if (!assigneeIds.contains(developerUserId)) {
                continue;
            }
            issuesAssigned++;
            int n = Math.max(1, assigneeIds.size());
            int rawSp = issue.getStoryPointsIssue() != null ? issue.getStoryPointsIssue() : 0;
            double spShare = (double) rawSp / n;

            String st = issue.getEstadoIssue() != null ? issue.getEstadoIssue().toLowerCase() : "todo";
            switch (st) {
                case "done" -> {
                    countDone++;
                    spDone += spShare;
                }
                case "in_progress" -> {
                    countInProgress++;
                    spInProgress += spShare;
                }
                case "blocked" -> {
                    countBlocked++;
                    spBlocked += spShare;
                }
                default -> {
                    countTodo++;
                    spTodo += spShare;
                }
            }
        }

        double spTotal = spTodo + spInProgress + spDone + spBlocked;
        double completion = issuesAssigned == 0 ? 0.0 : ((double) countDone / issuesAssigned);

        return DeveloperSprintKpisDTO.builder()
                .developerUserId(developerUserId)
                .sprintId(sprintId)
                .projectId(projectId)
                .issuesAssignedInSprint(issuesAssigned)
                .countTodo(countTodo)
                .countInProgress(countInProgress)
                .countDone(countDone)
                .countBlocked(countBlocked)
                .storyPointsAttributed(spTotal)
                .storyPointsTodo(spTodo)
                .storyPointsInProgress(spInProgress)
                .storyPointsDone(spDone)
                .storyPointsBlocked(spBlocked)
                .completionRateIssues(completion)
                .build();
    }

    private boolean isEquipoMember(Integer equipoId, Integer userId) {
        return infoUsuarioEquipoRepository.findById(new InfoUsuarioEquipoId(equipoId, userId)).isPresent();
    }
}
