package com.pistache.sprintops_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;
import java.util.Set;

@Entity
@Table(name = "equipo")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Equipo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_equipo")
    private Integer idEquipo;

    @Column(name = "nombre_equipo", length = 250)
    private String nombreEquipo;

    @Column(name = "descripcion", length = 250)
    private String descripcion;

    @Column(name = "fecha_creacion_equipo")
    private LocalDate fechaCreacionEquipo;

    @OneToMany(mappedBy = "equipo")
    private Set<RolesDeUsuarios> rolesDeUsuarios;

    @OneToMany(mappedBy = "equipo")
    private Set<InfoUsuarioEquipo> infoUsuarioEquipos;

    @OneToMany(mappedBy = "equipo")
    private Set<Proyecto> proyectos;
}
