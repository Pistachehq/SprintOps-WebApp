package com.pistache.sprintops_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

/**
 * Documento indexado para RAG (Reto D4). La columna VECTOR en Oracle se gestiona con JdbcTemplate;
 * {@link #insight} es @Transient para que Hibernate no intente mapear el tipo VECTOR.
 */
@Entity
@Table(name = "rag_insight")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RagInsight {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "description", length = 2000)
    private String description;

    @Column(name = "creation_ts")
    private OffsetDateTime creationTs;

    @Column(name = "done")
    private boolean done;

    @Column(name = "project_id")
    private Integer projectId;

    @Transient
    private float[] insight;
}
