package com.pistache.sprintops_backend.dto;

import com.pistache.sprintops_backend.model.PapeleraIssue;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class PapeleraIssueDTO {
    private Integer id;
    private Integer originalIssueId;
    private Integer sprintId;
    private Integer projectId;
    private String title;
    private String description;
    private String purpose;
    private String status;
    private String priority;
    private Integer storyPoints;
    private LocalDate createdAt;
    private LocalDateTime deletedAt;

    public static PapeleraIssueDTO fromEntity(PapeleraIssue p) {
        PapeleraIssueDTO dto = new PapeleraIssueDTO();
        dto.setId(p.getId());
        dto.setOriginalIssueId(p.getOriginalIssueId());
        dto.setSprintId(p.getSprintId());
        dto.setProjectId(p.getProyectoId());
        dto.setTitle(p.getTitulo());
        dto.setDescription(p.getDescripcion());
        dto.setPurpose(p.getProposito());
        dto.setStatus(p.getEstado());
        dto.setPriority(p.getPrioridad());
        dto.setStoryPoints(p.getStoryPoints());
        dto.setCreatedAt(p.getFechaCreacionIssue());
        dto.setDeletedAt(p.getFechaBorrado());
        return dto;
    }
}
