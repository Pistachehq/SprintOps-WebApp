package com.pistache.sprintops_backend.dto;

import com.pistache.sprintops_backend.model.Issues;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class IssueDTO {
    private Integer id;
    private Integer projectId;
    private String sprintId;
    private String title;
    private String description;
    private String purpose;
    private String status;
    private String priority;
    private Integer storyPoints;
    private Integer parentIssueId;
    private List<Integer> assigneeIds;
    private Integer reporterId;
    private LocalDate createdAt;
    private LocalDate completedAt;
    private String tagLabel;
    private String tagColor;

    public static IssueDTO fromEntity(Issues i, List<Integer> assigneeIds, String sprintId) {
        IssueDTO dto = new IssueDTO();
        dto.setId(i.getIdIssue());
        dto.setTitle(i.getTituloIssue());
        dto.setDescription(i.getDescripcionIssue());
        dto.setPurpose(i.getPropositoIssue());
        dto.setStatus(i.getEstadoIssue());
        dto.setPriority(i.getPrioridadIssue());
        dto.setStoryPoints(i.getStoryPointsIssue());
        dto.setParentIssueId(i.getParentIssueId());
        dto.setCreatedAt(i.getFechaCreacionIssue());
        dto.setCompletedAt(i.getFechaFinIssue());
        dto.setTagLabel(i.getTagLabel());
        dto.setTagColor(i.getTagColor());
        dto.setAssigneeIds(assigneeIds);
        dto.setSprintId(sprintId);
        if (i.getProyecto() != null) {
            dto.setProjectId(i.getProyecto().getIdProyecto());
        }
        return dto;
    }
}
