package com.pistache.sprintops_backend.service;

import com.pistache.sprintops_backend.model.Rol;
import com.pistache.sprintops_backend.repository.RolRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class RolService {

    @Autowired
    private RolRepository rolRepository;

    public List<Rol> findAll() {
        return rolRepository.findAll();
    }

    public Optional<Rol> findById(Integer id) {
        return rolRepository.findById(id);
    }

    public Optional<Rol> findByNombreRol(String nombreRol) {
        return rolRepository.findByNombreRol(nombreRol);
    }

    public Rol save(Rol rol) {
        return rolRepository.save(rol);
    }

    public void deleteById(Integer id) {
        rolRepository.deleteById(id);
    }

    public boolean existsById(Integer id) {
        return rolRepository.existsById(id);
    }
}
