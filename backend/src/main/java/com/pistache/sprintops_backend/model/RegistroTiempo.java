package com.pistache.sprintops_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "registro_tiempo")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegistroTiempo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_registro_tiempo")
    private Integer idRegistroTiempo;

    @ManyToOne(optional = false)
    @JoinColumn(name = "Issues_id_issue", nullable = false)
    private Issues issue;

    @ManyToOne(optional = false)
    @JoinColumn(name = "Usuario_id_usuario", nullable = false)
    private Usuario usuario;

    @Column(name = "horas", nullable = false, precision = 6, scale = 2)
    private BigDecimal horas;

    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;

    @Column(name = "nota", length = 250)
    private String nota;
}
