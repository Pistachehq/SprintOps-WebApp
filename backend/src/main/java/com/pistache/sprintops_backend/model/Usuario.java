package com.pistache.sprintops_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
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

    @OneToMany(mappedBy = "usuario")
    private Set<RolesDeUsuarios> rolesDeUsuarios;

    @OneToMany(mappedBy = "usuario")
    private Set<InfoUsuarioEquipo> infoUsuarioEquipos;

    @OneToMany(mappedBy = "usuario")
    private Set<RegistroReunion> registrosReunion;

    @OneToMany(mappedBy = "usuario")
    private Set<AsignacionIssues> asignacionIssues;
}
