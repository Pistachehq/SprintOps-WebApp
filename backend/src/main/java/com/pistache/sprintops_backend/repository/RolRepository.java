package com.pistache.sprintops_backend.repository;

import com.pistache.sprintops_backend.model.Rol;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RolRepository extends JpaRepository<Rol, Integer> {
    Optional<Rol> findByNombreRol(String nombreRol);
    List<Rol> findByProyecto_IdProyecto(Integer proyectoId);
    List<Rol> findByProyectoIsNull();
    List<Rol> findBySistemaTrue();
}
