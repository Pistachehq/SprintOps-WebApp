package com.pistache.sprintops_backend.repository;

import com.pistache.sprintops_backend.model.Issues;
import com.pistache.sprintops_backend.model.Proyecto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface IssuesRepository extends JpaRepository<Issues, Integer> {
    List<Issues> findByProyecto(Proyecto proyecto);
    List<Issues> findByProyectoIdProyecto(Integer proyectoId);
    List<Issues> findByEstadoIssue(String estado);
    List<Issues> findByPrioridadIssue(String prioridad);
    List<Issues> findByProyectoAndEstadoIssue(Proyecto proyecto, String estado);
}
