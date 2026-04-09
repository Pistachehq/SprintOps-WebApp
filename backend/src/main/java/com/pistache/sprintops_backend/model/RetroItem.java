package com.pistache.sprintops_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "retro_item")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RetroItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_item")
    private Integer idItem;

    @Column(name = "lo_bueno_retro", length = 250)
    private String loBuenoRetro;

    @Column(name = "lo_malo_retro", length = 250)
    private String loMaloRetro;

    @Column(name = "a_mejorar_retro", length = 250)
    private String aMejorarRetro;

    @ManyToOne
    @JoinColumn(name = "Retro_Sprint_id_retro")
    private RetroSprint retroSprint;
}
