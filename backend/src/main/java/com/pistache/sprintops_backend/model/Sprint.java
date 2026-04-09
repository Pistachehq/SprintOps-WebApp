package com.pistache.sprintops_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;
import java.util.Set;

@Entity
@Table(name = "sprint")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Sprint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_sprint")
    private Integer idSprint;

    @Column(name = "nombre_sprint", length = 250)
    private String nombreSprint;

    @Column(name = "fecha_inicio_sprint")
    private LocalDate fechaInicioSprint;

    @Column(name = "fecha_fin_sprint")
    private LocalDate fechaFinSprint;

    @Column(name = "objetivo_sprint", length = 250)
    private String objetivoSprint;

    @Column(name = "estado_del_sprint", length = 1)
    private String estadoDelSprint;

    @ManyToOne
    @JoinColumn(name = "Proyecto_id_proyecto")
    private Proyecto proyecto;

    @OneToMany(mappedBy = "sprint")
    private Set<Reunion> reuniones;

    @OneToMany(mappedBy = "sprint")
    private Set<DescIssue> descIssues;

    @OneToOne(mappedBy = "sprint")
    private RetroSprint retroSprint;

    @OneToMany(mappedBy = "sprint")
    private Set<MetricaSprint> metricasSprint;
}
