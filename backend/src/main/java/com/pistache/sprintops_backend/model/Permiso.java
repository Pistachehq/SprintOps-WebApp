package com.pistache.sprintops_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.Set;

@Entity
@Table(name = "permiso")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Permiso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_permiso")
    private Integer idPermiso;

    @Column(name = "nombre_permiso", length = 250)
    private String nombrePermiso;

    @Column(name = "descripcion_permisos", length = 250)
    private String descripcionPermisos;

    @OneToMany(mappedBy = "permiso")
    private Set<TablaPermisos> tablaPermisos;
}
