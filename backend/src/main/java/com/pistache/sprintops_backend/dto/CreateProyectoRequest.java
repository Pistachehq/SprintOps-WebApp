package com.pistache.sprintops_backend.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class CreateProyectoRequest {
    private String name;
    private String description;
    private LocalDate start;
    private LocalDate end;
    private Integer ownerId;
    /** agil | tiempo. Si viene vacío, se crea en modo ágil. */
    private String modo;
    private Boolean cotizacionHabilitada;
}
