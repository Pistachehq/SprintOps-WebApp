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

    @Column(name = "estado_del_sprint", length = 50)
    private String estadoDelSprint;

    @Column(name = "capacidad_story_points")
    private Integer capacidadStoryPoints;

    /** Issues enviados desde este sprint al siguiente (métrica Kanban). */
    @Column(name = "issues_enviados_siguiente")
    private Integer issuesEnviadosSiguiente;

    /** Suma de story points de esos envíos (misma métrica que issuesEnviadosSiguiente). */
    @Column(name = "story_points_enviados_siguiente")
    private Integer storyPointsEnviadosSiguiente;

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
