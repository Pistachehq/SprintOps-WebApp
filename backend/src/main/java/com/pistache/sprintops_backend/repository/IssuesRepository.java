package com.pistache.sprintops_backend.repository;

import com.pistache.sprintops_backend.model.Issues;
import com.pistache.sprintops_backend.model.Proyecto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface IssuesRepository extends JpaRepository<Issues, Integer> {
    List<Issues> findByProyecto(Proyecto proyecto);
    List<Issues> findByProyectoIdProyecto(Integer proyectoId);

    /**
     * Issues del proyecto: por FK directo a proyecto o por pertenencia a un sprint de ese proyecto (tabla desc_issue).
     * Evita exportaciones / listados incompletos cuando Proyecto_id_proyecto está null pero el issue está en un sprint del proyecto.
     */
    @Query(
            "SELECT DISTINCT i FROM Issues i WHERE i.proyecto.idProyecto = :projectId "
                    + "OR i.idIssue IN (SELECT d.issue.idIssue FROM DescIssue d WHERE d.sprint.proyecto.idProyecto = :projectId)"
    )
    List<Issues> findAllBelongingToProject(@Param("projectId") Integer projectId);
    List<Issues> findByEstadoIssue(String estado);
    List<Issues> findByPrioridadIssue(String prioridad);
    List<Issues> findByProyectoAndEstadoIssue(Proyecto proyecto, String estado);
}
