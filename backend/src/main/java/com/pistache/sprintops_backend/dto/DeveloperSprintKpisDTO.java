package com.pistache.sprintops_backend.dto;

import lombok.Builder;
import lombok.Data;

/**
 * KPIs de un desarrollador dentro de un sprint (issues asignadas en ese sprint).
 */
@Data
@Builder
public class DeveloperSprintKpisDTO {
    private Integer developerUserId;
    private Integer sprintId;
    private Integer projectId;
    /** Issues del sprint donde el usuario figura como asignado */
    private int issuesAssignedInSprint;
    private int countTodo;
    private int countInProgress;
    private int countDone;
    private int countBlocked;
    /** SP atribuidos al dev (SP del issue / nº de asignados, por issue) */
    private double storyPointsAttributed;
    private double storyPointsTodo;
    private double storyPointsInProgress;
    private double storyPointsDone;
    private double storyPointsBlocked;
    /** 0.0–1.0: issues en estado done / issues asignadas */
    private double completionRateIssues;
}
