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

    public static SprintDTO fromEntity(Sprint s) {
        SprintDTO dto = new SprintDTO();
        dto.setId(s.getIdSprint());
        dto.setName(s.getNombreSprint());
        dto.setGoal(s.getObjetivoSprint());
        dto.setStatus(s.getEstadoDelSprint());
        dto.setStartDate(s.getFechaInicioSprint());
        dto.setEndDate(s.getFechaFinSprint());
        if (s.getProyecto() != null) {
            dto.setProjectId(s.getProyecto().getIdProyecto());
        }
        return dto;
    }
}
