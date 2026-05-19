package com.pistache.sprintops_backend.service;

import com.pistache.sprintops_backend.model.InfoUsuarioEquipo;
import com.pistache.sprintops_backend.model.InfoUsuarioEquipo.InfoUsuarioEquipoId;
import com.pistache.sprintops_backend.model.Proyecto;
import com.pistache.sprintops_backend.model.RolesDeUsuarios;
import com.pistache.sprintops_backend.model.TablaPermisos;
import com.pistache.sprintops_backend.repository.InfoUsuarioEquipoRepository;
import com.pistache.sprintops_backend.repository.PermisoRepository;
import com.pistache.sprintops_backend.repository.RolesDeUsuariosRepository;
import com.pistache.sprintops_backend.repository.TablaPermisosRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProyectoPermissionCheckService {

    @Autowired
    private ProyectoService proyectoService;
    @Autowired
    private InfoUsuarioEquipoRepository infoUsuarioEquipoRepository;
    @Autowired
    private RolesDeUsuariosRepository rolesDeUsuariosRepository;
    @Autowired
    private TablaPermisosRepository tablaPermisosRepository;
    @Autowired
    private PermisoRepository permisoRepository;

    /**
     * Usuario miembro del equipo del proyecto y su rol tiene el permiso indicado (por nombre).
     */
    public boolean memberHasPermission(Integer userId, Integer proyectoId, String permisoNombre) {
        if (userId == null || proyectoId == null || permisoNombre == null || permisoNombre.isBlank()) {
            return false;
        }
        Optional<Proyecto> optP = proyectoService.findById(proyectoId);
        if (optP.isEmpty() || optP.get().getEquipo() == null) {
            return false;
        }
        Integer equipoId = optP.get().getEquipo().getIdEquipo();
        Optional<InfoUsuarioEquipo> mem = infoUsuarioEquipoRepository.findById(
                new InfoUsuarioEquipoId(equipoId, userId));
        if (mem.isEmpty()) {
            return false;
        }
        Optional<RolesDeUsuarios> roleRow =
                rolesDeUsuariosRepository.findByEquipo_IdEquipoAndUsuario_IdUsuario(equipoId, userId);
        if (roleRow.isEmpty()) {
            return false;
        }
        Integer rolId = roleRow.get().getRol().getIdRol();
        var permOpt = permisoRepository.findByNombrePermiso(permisoNombre);
        if (permOpt.isEmpty()) {
            return false;
        }
        Integer permisoId = permOpt.get().getIdPermiso();
        List<TablaPermisos> links = tablaPermisosRepository.findByRolIdRol(rolId);
        return links.stream().anyMatch(tp -> tp.getPermiso().getIdPermiso().equals(permisoId));
    }
}
