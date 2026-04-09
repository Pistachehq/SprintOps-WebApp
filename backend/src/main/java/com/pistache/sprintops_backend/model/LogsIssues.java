package com.pistache.sprintops_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "logs_issues")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LogsIssues {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_logissue")
    private Integer idLogissue;

    @Column(name = "descripcion_log_issue", length = 500)
    private String descripcionLogIssue;

    @Column(name = "actor_log_issue", length = 500)
    private String actorLogIssue;

    @Column(name = "tipo_accion", length = 250)
    private String tipoAccion;

    @Column(name = "fecha_creacion_log_issue", length = 250)
    private String fechaCreacionLogIssue;

    @ManyToOne
    @JoinColumn(name = "Issues_id_issue")
    private Issues issue;
}
