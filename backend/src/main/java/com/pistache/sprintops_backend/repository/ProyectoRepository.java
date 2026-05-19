package com.pistache.sprintops_backend.repository;

import com.pistache.sprintops_backend.model.Proyecto;
import com.pistache.sprintops_backend.model.Equipo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProyectoRepository extends JpaRepository<Proyecto, Integer> {
    Optional<Proyecto> findByNombreProyecto(String nombreProyecto);
    Optional<Proyecto> findByCodigoProyecto(String codigoProyecto);

    boolean existsByCodigoProyecto(String codigoProyecto);
    List<Proyecto> findByEquipo(Equipo equipo);
    List<Proyecto> findByEstadoDelProyecto(String estado);
}
