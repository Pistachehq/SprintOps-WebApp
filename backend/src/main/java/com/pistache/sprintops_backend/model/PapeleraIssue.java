package com.pistache.sprintops_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "papelera_issue")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PapeleraIssue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "original_issue_id")
    private Integer originalIssueId;

    @Column(name = "sprint_id")
    private Integer sprintId;

    @Column(name = "proyecto_id")
    private Integer proyectoId;

    @Column(name = "titulo", length = 250)
    private String titulo;

    @Column(name = "descripcion", length = 500)
    private String descripcion;

    @Column(name = "proposito", length = 500)
    private String proposito;

    @Column(name = "estado", length = 50)
    private String estado;

    @Column(name = "prioridad", length = 250)
    private String prioridad;

    @Column(name = "story_points")
    private Integer storyPoints;

    @Column(name = "parent_issue_id")
    private Integer parentIssueId;

    @Column(name = "fecha_creacion_issue")
    private LocalDate fechaCreacionIssue;

    @Column(name = "fecha_borrado")
    private LocalDateTime fechaBorrado;
}
