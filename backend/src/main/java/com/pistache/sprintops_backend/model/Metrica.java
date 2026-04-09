package com.pistache.sprintops_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.Set;

@Entity
@Table(name = "metrica")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Metrica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_metrica")
    private Integer idMetrica;

    @Column(name = "nombre_metrica", length = 250)
    private String nombreMetrica;

    @OneToMany(mappedBy = "metrica")
    private Set<MetricaSprint> metricasSprint;
}
