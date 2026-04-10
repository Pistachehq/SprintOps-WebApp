package com.pistache.sprintops_backend.repository;

import com.pistache.sprintops_backend.model.Sprint;
import com.pistache.sprintops_backend.model.Proyecto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SprintRepository extends JpaRepository<Sprint, Integer> {
    List<Sprint> findByProyecto(Proyecto proyecto);
    List<Sprint> findByProyectoIdProyecto(Integer proyectoId);
    List<Sprint> findByEstadoDelSprint(String estado);
    List<Sprint> findByProyectoAndEstadoDelSprint(Proyecto proyecto, String estado);
}
