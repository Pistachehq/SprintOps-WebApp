package com.pistache.sprintops_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;
import java.util.Set;

@Entity
@Table(name = "issues")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Issues {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_issue")
    private Integer idIssue;

    @Column(name = "titulo_issue", length = 250)
    private String tituloIssue;

    @Column(name = "descripcion_issue", length = 500)
    private String descripcionIssue;

    @Column(name = "proposito_issue", length = 500)
    private String propositoIssue;

    @Column(name = "estado_issue", length = 50)
    private String estadoIssue;

    @Column(name = "prioridad_issue", length = 250)
    private String prioridadIssue;

    @Column(name = "story_points_issue")
    private Integer storyPointsIssue;

    @Column(name = "fecha_creacion_issue")
    private LocalDate fechaCreacionIssue;

    @Column(name = "fecha_fin_issue")
    private LocalDate fechaFinIssue;

    @Column(name = "parent_issue_id")
    private Integer parentIssueId;

    @Column(name = "tag_label", length = 100)
    private String tagLabel;

    @Column(name = "tag_color", length = 20)
    private String tagColor;

    @ManyToOne
    @JoinColumn(name = "Proyecto_id_proyecto")
    private Proyecto proyecto;

    @OneToMany(mappedBy = "issue")
    private Set<AsignacionIssues> asignacionIssues;

    @OneToMany(mappedBy = "issue")
    private Set<DescIssue> descIssues;

    @OneToMany(mappedBy = "issue")
    private Set<LogsIssues> logsIssues;
}
