package com.pistache.sprintops_backend.dto;

import com.pistache.sprintops_backend.model.Proyecto;
import lombok.Data;
import java.time.LocalDate;

@Data
public class ProyectoDTO {
    private Integer id;
    private String name;
    private String description;
    private String codigo;
    private String status;
    private LocalDate start;
    private LocalDate end;
    private Integer equipoId;
    private Integer creadorId;
    private String creadorName;
    /** true si hay imagen de card subida al servidor (todos los miembros la ven). */
    private Boolean cardCoverCustom;
    private Long cardCoverVersion;

    public static ProyectoDTO fromEntity(Proyecto p) {
        ProyectoDTO dto = new ProyectoDTO();
        dto.setId(p.getIdProyecto());
        dto.setName(p.getNombreProyecto());
        dto.setDescription(p.getDescripcionProyecto());
        dto.setCodigo(p.getCodigoProyecto());
        dto.setStatus(p.getEstadoDelProyecto());
        dto.setStart(p.getFechaInicioProyecto());
        dto.setEnd(p.getFechaFinProyecto());
        if (p.getEquipo() != null) {
            dto.setEquipoId(p.getEquipo().getIdEquipo());
        }
        if (p.getCreador() != null) {
            dto.setCreadorId(p.getCreador().getIdUsuario());
            dto.setCreadorName(p.getCreador().getNombreUsuario());
        }
        dto.setCardCoverCustom(Boolean.TRUE.equals(p.getCardCoverCustom()));
        dto.setCardCoverVersion(p.getCardCoverVersion() != null ? p.getCardCoverVersion() : 0L);
        return dto;
    }
}
