package com.pistache.sprintops_backend.repository;

import com.pistache.sprintops_backend.model.Reunion;
import com.pistache.sprintops_backend.model.Sprint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReunionRepository extends JpaRepository<Reunion, Integer> {
    List<Reunion> findBySprint(Sprint sprint);
    List<Reunion> findByTipoReunion(String tipoReunion);
    List<Reunion> findByFechaDeReunion(LocalDate fecha);
    List<Reunion> findBySprintIdSprintOrderByFechaDeReunionDesc(Integer sprintId);

    List<Reunion> findBySprintIdSprintAndTipoReunionOrderByFechaDeReunionDesc(Integer sprintId, String tipoReunion);

    Optional<Reunion> findBySprintIdSprintAndFechaDeReunionAndTipoReunion(Integer sprintId, LocalDate fecha, String tipo);
}
