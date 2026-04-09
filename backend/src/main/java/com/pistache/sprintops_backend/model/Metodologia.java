package com.pistache.sprintops_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "metodologia")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Metodologia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_metodologia")
    private Integer idMetodologia;

    @Column(name = "nombre_metodologia", length = 250)
    private String nombreMetodologia;

    @OneToOne
    @JoinColumn(name = "Proyecto_id_proyecto")
    private Proyecto proyecto;
}
