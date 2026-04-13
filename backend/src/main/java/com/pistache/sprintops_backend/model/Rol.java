package com.pistache.sprintops_backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
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

    @Column(name = "sistema", nullable = false)
    private Boolean sistema = false;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "proyecto_id_proyecto")
    private Proyecto proyecto;

    public Integer getProyectoId() {
        return proyecto != null ? proyecto.getIdProyecto() : null;
    }

    @JsonIgnore
    @OneToMany(mappedBy = "rol")
    private Set<TablaPermisos> tablaPermisos;

    @JsonIgnore
    @OneToMany(mappedBy = "rol")
    private Set<RolesDeUsuarios> rolesDeUsuarios;
}
