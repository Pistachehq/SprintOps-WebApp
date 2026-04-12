package com.pistache.sprintops_backend.repository;

import com.pistache.sprintops_backend.model.TimelineFoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TimelineFotoRepository extends JpaRepository<TimelineFoto, Integer> {

    Optional<TimelineFoto> findByProyectoIdProyectoAndFecha(Integer projectId, LocalDate fecha);

    @Query("SELECT t.fecha FROM TimelineFoto t WHERE t.proyecto.idProyecto = :projectId")
    List<LocalDate> findDatesByProjectId(Integer projectId);

    void deleteByProyectoIdProyectoAndFecha(Integer projectId, LocalDate fecha);
}
