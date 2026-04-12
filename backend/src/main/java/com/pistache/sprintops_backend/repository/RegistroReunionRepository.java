package com.pistache.sprintops_backend.repository;

import com.pistache.sprintops_backend.model.RegistroReunion;
import com.pistache.sprintops_backend.model.Reunion;
import com.pistache.sprintops_backend.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RegistroReunionRepository extends JpaRepository<RegistroReunion, Integer> {
    List<RegistroReunion> findByReunion(Reunion reunion);
    List<RegistroReunion> findByUsuario(Usuario usuario);
    Optional<RegistroReunion> findByReunionIdReunionAndUsuarioIdUsuario(Integer reunionId, Integer usuarioId);
}
