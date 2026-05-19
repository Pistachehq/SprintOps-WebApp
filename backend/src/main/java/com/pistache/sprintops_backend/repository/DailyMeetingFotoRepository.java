package com.pistache.sprintops_backend.repository;

import com.pistache.sprintops_backend.model.DailyMeetingFoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyMeetingFotoRepository extends JpaRepository<DailyMeetingFoto, Integer> {

    Optional<DailyMeetingFoto> findByProyecto_IdProyectoAndFechaFoto(Integer proyectoId, LocalDate fecha);

    List<DailyMeetingFoto> findByProyecto_IdProyectoOrderByFechaFotoAsc(Integer proyectoId);
}
