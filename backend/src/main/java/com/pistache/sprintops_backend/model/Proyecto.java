package com.pistache.sprintops_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import java.time.LocalDate;
import java.util.Set;

@Entity
@Table(name = "proyecto")
@Data
@EqualsAndHashCode(exclude = {"equipo", "creador", "metodologia", "sprints", "issues"})
@ToString(exclude = {"equipo", "creador", "metodologia", "sprints", "issues"})
@NoArgsConstructor
@AllArgsConstructor
public class Proyecto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_proyecto")
    private Integer idProyecto;

    @Column(name = "nombre_proyecto", length = 250)
    private String nombreProyecto;

    @Column(name = "codigo_proyecto", length = 5, unique = true)
    private String codigoProyecto;

    @Column(name = "descripcion_proyecto", length = 250)
    private String descripcionProyecto;

    @Column(name = "fecha_inicio_proyecto")
    private LocalDate fechaInicioProyecto;

    @Column(name = "fecha_fin_proyecto")
    private LocalDate fechaFinProyecto;

    @Column(name = "estado_del_proyecto", length = 50)
    private String estadoDelProyecto;

    /** Portada de la card en home: imagen subida por el equipo (visible para todos los miembros). */
    @Column(name = "card_cover_custom")
    private Boolean cardCoverCustom = false;

    @Column(name = "card_cover_version")
    private Long cardCoverVersion = 0L;

    @Column(name = "card_cover_content_type", length = 100)
    private String cardCoverContentType;

    @ManyToOne
    @JoinColumn(name = "Equipo_id_equipo")
    private Equipo equipo;

    @ManyToOne
    @JoinColumn(name = "creador_id_usuario")
    private Usuario creador;

    @OneToOne(mappedBy = "proyecto")
    private Metodologia metodologia;

    @OneToMany(mappedBy = "proyecto")
    private Set<Sprint> sprints;

    @OneToMany(mappedBy = "proyecto")
    private Set<Issues> issues;
}
