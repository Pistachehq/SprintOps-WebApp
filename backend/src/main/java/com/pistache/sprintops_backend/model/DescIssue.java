package com.pistache.sprintops_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.io.Serializable;
import java.time.LocalDate;

@Entity
@Table(name = "desc_issue")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DescIssue {

    @EmbeddedId
    private DescIssueId id;

    @Column(name = "fecha_entrada")
    private LocalDate fechaEntrada;

    @Column(name = "fecha_salida")
    private LocalDate fechaSalida;

    @ManyToOne
    @MapsId("sprintId")
    @JoinColumn(name = "Sprint_id_sprint")
    private Sprint sprint;

    @ManyToOne
    @MapsId("issueId")
    @JoinColumn(name = "Issues_id_issue")
    private Issues issue;

    @Embeddable
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DescIssueId implements Serializable {
        private Integer sprintId;
        private Integer issueId;
    }
}
