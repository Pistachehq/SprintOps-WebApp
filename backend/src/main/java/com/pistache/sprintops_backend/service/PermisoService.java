package com.pistache.sprintops_backend.service;

import com.pistache.sprintops_backend.model.Permiso;
import com.pistache.sprintops_backend.repository.PermisoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class PermisoService {

    @Autowired
    private PermisoRepository permisoRepository;

    public List<Permiso> findAll() {
        return permisoRepository.findAll();
    }

    public Optional<Permiso> findById(Integer id) {
        return permisoRepository.findById(id);
    }

    public Optional<Permiso> findByNombrePermiso(String nombrePermiso) {
        return permisoRepository.findByNombrePermiso(nombrePermiso);
    }

    public Permiso save(Permiso permiso) {
        return permisoRepository.save(permiso);
    }

    public void deleteById(Integer id) {
        permisoRepository.deleteById(id);
    }

    public boolean existsById(Integer id) {
        return permisoRepository.existsById(id);
    }
}
