package com.pistache.sprintops_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

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

    @Column(name = "que_hice", columnDefinition = "TEXT")
    private String queHice;

    @Column(name = "que_hare", columnDefinition = "TEXT")
    private String queHare;

    @Column(name = "impedimentos", columnDefinition = "TEXT")
    private String impedimentos;

    /** Última vez que este usuario guardó sus respuestas para esta reunión. */
    @Column(name = "fecha_hora_registro")
    private LocalDateTime fechaHoraRegistro;

    @ManyToOne
    @JoinColumn(name = "Usuario_id_usuario")
    private Usuario usuario;

    @ManyToOne
    @JoinColumn(name = "Reunion_id_reunion")
    private Reunion reunion;
}
