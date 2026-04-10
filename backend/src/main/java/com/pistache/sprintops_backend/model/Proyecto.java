package com.pistache.sprintops_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;
import java.util.Set;

@Entity
@Table(name = "proyecto")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Proyecto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_proyecto")
    private Integer idProyecto;

    @Column(name = "nombre_proyecto", length = 250)
    private String nombreProyecto;

    @Column(name = "codigo_proyecto", length = 5, unique = true)
    private String codigoProyecto;

    @Column(name = "descripcion_proyecto", length = 250)
    private String descripcionProyecto;

    @Column(name = "fecha_inicio_proyecto")
    private LocalDate fechaInicioProyecto;

    @Column(name = "fecha_fin_proyecto")
    private LocalDate fechaFinProyecto;

    @Column(name = "estado_del_proyecto", length = 50)
    private String estadoDelProyecto;

    @ManyToOne
    @JoinColumn(name = "Equipo_id_equipo")
    private Equipo equipo;

    @OneToOne(mappedBy = "proyecto")
    private Metodologia metodologia;

    @OneToMany(mappedBy = "proyecto")
    private Set<Sprint> sprints;

    @OneToMany(mappedBy = "proyecto")
    private Set<Issues> issues;
}
