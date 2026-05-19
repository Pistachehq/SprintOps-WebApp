package com.pistache.sprintops_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Set;

@Entity
@Table(name = "usuario")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_usuario")
    private Integer idUsuario;

    @Column(name = "nombre_usuario", length = 100)
    private String nombreUsuario;

    @Column(name = "email_usuario", length = 250)
    private String emailUsuario;

    @Column(name = "password_hash", length = 250)
    private String passwordHash;

    @Column(name = "fecha_registro_usuario")
    private LocalDate fechaRegistroUsuario;

    @Column(name = "activo_usuario", length = 1)
    private String activoUsuario;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    /** "1" verificado, "0" pendiente; null se trata como verificado (usuarios previos a esta columna). */
    @Column(name = "email_verificado", length = 1)
    private String emailVerificado;

    @Column(name = "verificacion_token", length = 64)
    private String verificacionToken;

    @Column(name = "verificacion_expira")
    private Instant verificacionExpira;

    /** ID numérico de Telegram (@Bot: mismo usuario en chat privado). Único en la app. */
    @Column(name = "telegram_user_id", unique = true)
    private Long telegramUserId;

    /** Teléfono solo si el usuario lo comparte explícitamente al bot (contacto). */
    @Column(name = "telegram_phone", length = 40)
    private String telegramPhone;

    /** Proyecto activo para el bot único (un token): contexto /proyecto. */
    @Column(name = "telegram_proyecto_id")
    private Integer telegramProyectoId;

    /**
     * Solo dígitos (sin espacios ni +). Lo guardas desde la web antes de vincular Telegram;
     * debe coincidir con el número que compartes en Telegram. Se limpia al desvincular.
     */
    @Column(name = "telefono_vinculo_norm", length = 32, unique = true)
    private String telefonoVinculoNorm;

    /** Proyecto sugerido al vincular (desde la web), aplicado al completar el enlace por teléfono. */
    @Column(name = "telegram_proyecto_pendiente")
    private Integer telegramProyectoPendiente;

    @OneToMany(mappedBy = "usuario")
    private Set<RolesDeUsuarios> rolesDeUsuarios;

    @OneToMany(mappedBy = "usuario")
    private Set<InfoUsuarioEquipo> infoUsuarioEquipos;

    @OneToMany(mappedBy = "usuario")
    private Set<RegistroReunion> registrosReunion;

    @OneToMany(mappedBy = "usuario")
    private Set<AsignacionIssues> asignacionIssues;
}
