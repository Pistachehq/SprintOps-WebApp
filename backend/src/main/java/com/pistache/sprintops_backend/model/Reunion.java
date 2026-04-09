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

    @OneToMany(mappedBy = "reunion")
    private Set<RegistroReunion> registrosReunion;
}
