package com.pistache.sprintops_backend.repository;

import com.pistache.sprintops_backend.model.TablaPermisos;
import com.pistache.sprintops_backend.model.TablaPermisos.TablaPermisosId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TablaPermisosRepository extends JpaRepository<TablaPermisos, TablaPermisosId> {
    List<TablaPermisos> findByRolIdRol(Integer rolId);
    List<TablaPermisos> findByPermisoIdPermiso(Integer permisoId);
}
