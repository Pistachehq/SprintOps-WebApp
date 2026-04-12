package com.pistache.sprintops_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;
import java.util.Set;

@Entity
@Table(name = "reunion")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Reunion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_reunion")
    private Integer idReunion;

    @Column(name = "tipo_reunion", length = 250)
    private String tipoReunion;

    @Column(name = "fecha_de_reunion")
    private LocalDate fechaDeReunion;

    @ManyToOne
    @JoinColumn(name = "Sprint_id_sprint")
    private Sprint sprint;

    /** Denormalizado desde el sprint para consultas/reportes sin join extra. */
    @ManyToOne
    @JoinColumn(name = "Proyecto_id_proyecto")
    private Proyecto proyecto;

    @OneToMany(mappedBy = "reunion")
    private Set<RegistroReunion> registrosReunion;
}
