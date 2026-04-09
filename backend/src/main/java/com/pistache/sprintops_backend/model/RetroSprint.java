package com.pistache.sprintops_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;
import java.util.Set;

@Entity
@Table(name = "retro_sprint")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RetroSprint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_retro")
    private Integer idRetro;

    @Column(name = "fecha_retro")
    private LocalDate fechaRetro;

    @OneToOne
    @JoinColumn(name = "Sprint_id_sprint")
    private Sprint sprint;

    @OneToMany(mappedBy = "retroSprint")
    private Set<RetroItem> retroItems;
}
