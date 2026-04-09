package com.pistache.sprintops_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.io.Serializable;

@Entity
@Table(name = "asignacion_issues")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AsignacionIssues {

    @EmbeddedId
    private AsignacionIssuesId id;

    @ManyToOne
    @MapsId("usuarioId")
    @JoinColumn(name = "Usuario_id_usuario")
    private Usuario usuario;

    @ManyToOne
    @MapsId("issueId")
    @JoinColumn(name = "Issues_id_issue")
    private Issues issue;

    @Embeddable
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AsignacionIssuesId implements Serializable {
        private Integer usuarioId;
        private Integer issueId;
    }
}
