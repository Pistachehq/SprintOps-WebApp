package com.pistache.sprintops_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "metodologia")
@Data
@EqualsAndHashCode(exclude = {"proyecto"})
@ToString(exclude = {"proyecto"})
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
