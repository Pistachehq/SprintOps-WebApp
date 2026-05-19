package com.pistache.sprintops_backend.repository;

import com.pistache.sprintops_backend.model.RolesDeUsuarios;
import com.pistache.sprintops_backend.model.RolesDeUsuarios.RolesDeUsuariosId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RolesDeUsuariosRepository extends JpaRepository<RolesDeUsuarios, RolesDeUsuariosId> {
    List<RolesDeUsuarios> findByUsuarioIdUsuario(Integer usuarioId);

    List<RolesDeUsuarios> findByEquipoIdEquipo(Integer equipoId);

    List<RolesDeUsuarios> findByRolIdRol(Integer rolId);

    Optional<RolesDeUsuarios> findByEquipo_IdEquipoAndUsuario_IdUsuario(Integer equipoId, Integer usuarioId);
}
