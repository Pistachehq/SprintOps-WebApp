package com.pistache.sprintops_backend.service;

import com.pistache.sprintops_backend.model.Equipo;
import com.pistache.sprintops_backend.repository.EquipoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class EquipoService {

    @Autowired
    private EquipoRepository equipoRepository;

    public List<Equipo> findAll() {
        return equipoRepository.findAll();
    }

    public Optional<Equipo> findById(Integer id) {
        return equipoRepository.findById(id);
    }

    public Optional<Equipo> findByNombreEquipo(String nombreEquipo) {
        return equipoRepository.findByNombreEquipo(nombreEquipo);
    }

    public Equipo save(Equipo equipo) {
        return equipoRepository.save(equipo);
    }

    public void deleteById(Integer id) {
        equipoRepository.deleteById(id);
    }

    public boolean existsById(Integer id) {
        return equipoRepository.existsById(id);
    }
}
