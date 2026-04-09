package com.pistache.sprintops_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.io.Serializable;
import java.time.LocalDate;

@Entity
@Table(name = "metrica_sprint")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MetricaSprint {

    @EmbeddedId
    private MetricaSprintId id;

    @Column(name = "valor_metrica", length = 250)
    private String valorMetrica;

    @Column(name = "fecha_calculo_metrica")
    private LocalDate fechaCalculoMetrica;

    @ManyToOne
    @MapsId("sprintId")
    @JoinColumn(name = "Sprint_id_sprint")
    private Sprint sprint;

    @ManyToOne
    @MapsId("metricaId")
    @JoinColumn(name = "Metrica_id_metrica")
    private Metrica metrica;

    @Embeddable
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MetricaSprintId implements Serializable {
        private Integer sprintId;
        private Integer metricaId;
    }
}
