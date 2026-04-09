package com.pistache.sprintops_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.io.Serializable;

@Entity
@Table(name = "tabla_permisos")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TablaPermisos {

    @EmbeddedId
    private TablaPermisosId id;

    @ManyToOne
    @MapsId("rolId")
    @JoinColumn(name = "Rol_id_rol")
    private Rol rol;

    @ManyToOne
    @MapsId("permisoId")
    @JoinColumn(name = "Permiso_id_permiso")
    private Permiso permiso;

    @Embeddable
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TablaPermisosId implements Serializable {
        private Integer rolId;
        private Integer permisoId;
    }
}
