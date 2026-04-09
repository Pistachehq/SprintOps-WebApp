package com.pistache.sprintops_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.Set;

@Entity
@Table(name = "rol")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Rol {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_rol")
    private Integer idRol;

    @Column(name = "nombre_rol", length = 100)
    private String nombreRol;

    @OneToMany(mappedBy = "rol")
    private Set<TablaPermisos> tablaPermisos;

    @OneToMany(mappedBy = "rol")
    private Set<RolesDeUsuarios> rolesDeUsuarios;
}
