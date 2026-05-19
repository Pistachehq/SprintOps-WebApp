package com.pistache.sprintops_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(
        name = "daily_meeting_foto",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_daily_meeting_foto_proyecto_fecha",
                columnNames = {"proyecto_id", "fecha_foto"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DailyMeetingFoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "proyecto_id", nullable = false)
    private Proyecto proyecto;

    @Column(name = "fecha_foto", nullable = false)
    private LocalDate fechaFoto;

    @Lob
    @Column(name = "imagen", nullable = false, columnDefinition = "LONGBLOB")
    private byte[] imagen;

    @Column(name = "content_type", length = 100)
    private String contentType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario subidoPor;
}
