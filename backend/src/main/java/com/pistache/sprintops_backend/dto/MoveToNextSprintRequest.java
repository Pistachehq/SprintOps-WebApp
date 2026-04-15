package com.pistache.sprintops_backend.dto;

import lombok.Data;

/**
 * Body de {@code POST /api/issues/{id}/move-to-next-sprint}.
 * {@code storyPoints} opcional: SP que muestra el Kanban (si la fila en BD viene vacía).
 */
@Data
public class MoveToNextSprintRequest {
    private Integer fromSprintId;
    private Integer toSprintId;
    private String username;
    private Integer userId;
    private Integer storyPoints;
}
