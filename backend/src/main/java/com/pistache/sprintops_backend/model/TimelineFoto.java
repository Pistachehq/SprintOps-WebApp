package com.pistache.sprintops_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "timeline_foto", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"proyecto_id", "fecha"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TimelineFoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "proyecto_id")
    private Proyecto proyecto;

    @Column(name = "fecha")
    private LocalDate fecha;

    @Lob
    @Column(name = "imagen", columnDefinition = "LONGBLOB")
    private byte[] imagen;

    @Column(name = "content_type", length = 100)
    private String contentType;

    @ManyToOne
    @JoinColumn(name = "uploaded_by")
    private Usuario uploadedBy;
}
