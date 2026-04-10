package com.pistache.sprintops_backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class CreateIssueRequest {
    private Integer projectId;
    private String sprintId;
    private String title;
    private String description;
    private String status;
    private String priority;
    private Integer storyPoints;
    private List<Integer> assigneeIds;
}
