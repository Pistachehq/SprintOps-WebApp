package com.pistache.sprintops_backend.dto;

import com.pistache.sprintops_backend.model.Sprint;
import lombok.Data;
import java.time.LocalDate;

@Data
public class SprintDTO {
    private Integer id;
    private Integer projectId;
    private String name;
    private String goal;
    private String status;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer capacity;
    /** Contador persistido: tareas pasadas al siguiente sprint desde este sprint. */
    private Integer issuesSentToNextSprint;
    /** Suma de SP de esas tareas al momento del envío. */
    private Integer storyPointsSentToNextSprint;

    public static SprintDTO fromEntity(Sprint s) {
        SprintDTO dto = new SprintDTO();
        dto.setId(s.getIdSprint());
        dto.setName(s.getNombreSprint());
        dto.setGoal(s.getObjetivoSprint());
        dto.setStatus(s.getEstadoDelSprint());
        dto.setStartDate(s.getFechaInicioSprint());
        dto.setEndDate(s.getFechaFinSprint());
        dto.setCapacity(s.getCapacidadStoryPoints());
        if (s.getProyecto() != null) {
            dto.setProjectId(s.getProyecto().getIdProyecto());
        }
        dto.setIssuesSentToNextSprint(s.getIssuesEnviadosSiguiente() != null ? s.getIssuesEnviadosSiguiente() : 0);
        dto.setStoryPointsSentToNextSprint(
                s.getStoryPointsEnviadosSiguiente() != null ? s.getStoryPointsEnviadosSiguiente() : 0);
        return dto;
    }
}
