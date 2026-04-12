package com.pistache.sprintops_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import java.io.Serializable;

@Entity
@Table(name = "tabla_permisos")
@Data
@EqualsAndHashCode(exclude = {"rol", "permiso"})
@ToString(exclude = {"rol", "permiso"})
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
