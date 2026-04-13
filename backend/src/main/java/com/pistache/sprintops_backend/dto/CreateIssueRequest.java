package com.pistache.sprintops_backend.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class CreateIssueRequest {
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
    private LocalDate endDate;
    private String tagLabel;
    private String tagColor;
}
