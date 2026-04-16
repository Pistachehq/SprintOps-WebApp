package com.pistache.sprintops_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "telegram_codigo_vinculo")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TelegramCodigoVinculo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "codigo", length = 16, nullable = false, unique = true)
    private String codigo;

    @Column(name = "id_usuario", nullable = false)
    private Integer idUsuario;

    @Column(name = "expira", nullable = false)
    private Instant expira;

    @Column(name = "usado", nullable = false)
    private boolean usado;

    /** Si viene de un enlace desde un proyecto, se fija al vincular (si el usuario es miembro). */
    @Column(name = "proyecto_sugerido_id")
    private Integer proyectoSugeridoId;
}
