package com.pistache.sprintops_backend.repository;

import com.pistache.sprintops_backend.model.Equipo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface EquipoRepository extends JpaRepository<Equipo, Integer> {
    Optional<Equipo> findByNombreEquipo(String nombreEquipo);
}
