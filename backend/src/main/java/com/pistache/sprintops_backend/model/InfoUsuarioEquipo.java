package com.pistache.sprintops_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.io.Serializable;
import java.time.LocalDate;

@Entity
@Table(name = "info_usuario_equipo")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InfoUsuarioEquipo {

    @EmbeddedId
    private InfoUsuarioEquipoId id;

    @Column(name = "fecha_union_equipo")
    private LocalDate fechaUnionEquipo;

    @ManyToOne
    @MapsId("equipoId")
    @JoinColumn(name = "Equipo_id_equipo")
    private Equipo equipo;

    @ManyToOne
    @MapsId("usuarioId")
    @JoinColumn(name = "Usuario_id_usuario")
    private Usuario usuario;

    @Embeddable
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InfoUsuarioEquipoId implements Serializable {
        private Integer equipoId;
        private Integer usuarioId;
    }
}
