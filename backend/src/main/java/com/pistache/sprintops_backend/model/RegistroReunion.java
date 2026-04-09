package com.pistache.sprintops_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "registro_reunion")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegistroReunion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_registro")
    private Integer idRegistro;

    @Column(name = "que_hice", length = 250)
    private String queHice;

    @Column(name = "que_hare", length = 250)
    private String queHare;

    @Column(name = "impedimentos", length = 250)
    private String impedimentos;

    @ManyToOne
    @JoinColumn(name = "Usuario_id_usuario")
    private Usuario usuario;

    @ManyToOne
    @JoinColumn(name = "Reunion_id_reunion")
    private Reunion reunion;
}
