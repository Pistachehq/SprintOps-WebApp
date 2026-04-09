package com.pistache.sprintops_backend.repository;

import com.pistache.sprintops_backend.model.Metodologia;
import com.pistache.sprintops_backend.model.Proyecto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface MetodologiaRepository extends JpaRepository<Metodologia, Integer> {
    Optional<Metodologia> findByProyecto(Proyecto proyecto);
    Optional<Metodologia> findByNombreMetodologia(String nombreMetodologia);
}
