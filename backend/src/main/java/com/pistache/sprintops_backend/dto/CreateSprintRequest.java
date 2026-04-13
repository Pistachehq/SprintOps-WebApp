package com.pistache.sprintops_backend.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class CreateSprintRequest {
    private Integer projectId;
    private String name;
    private String goal;
    private String status;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer capacity;
}
