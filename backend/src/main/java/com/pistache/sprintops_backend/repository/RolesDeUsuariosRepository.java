package com.pistache.sprintops_backend.repository;

import com.pistache.sprintops_backend.model.RolesDeUsuarios;
import com.pistache.sprintops_backend.model.RolesDeUsuarios.RolesDeUsuariosId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RolesDeUsuariosRepository extends JpaRepository<RolesDeUsuarios, RolesDeUsuariosId> {
    List<RolesDeUsuarios> findByUsuarioIdUsuario(Integer usuarioId);
    List<RolesDeUsuarios> findByEquipoIdEquipo(Integer equipoId);
    List<RolesDeUsuarios> findByRolIdRol(Integer rolId);
}
