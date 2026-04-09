package com.pistache.sprintops_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.io.Serializable;

@Entity
@Table(name = "roles_de_usuarios")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RolesDeUsuarios {

    @EmbeddedId
    private RolesDeUsuariosId id;

    @ManyToOne
    @MapsId("rolId")
    @JoinColumn(name = "Rol_id_rol")
    private Rol rol;

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
    public static class RolesDeUsuariosId implements Serializable {
        private Integer rolId;
        private Integer equipoId;
        private Integer usuarioId;
    }
}
