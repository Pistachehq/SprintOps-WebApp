package com.pistache.sprintops_backend.service;

import com.pistache.sprintops_backend.model.Reunion;
import com.pistache.sprintops_backend.model.Sprint;
import com.pistache.sprintops_backend.repository.ReunionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class ReunionService {

    @Autowired
    private ReunionRepository reunionRepository;

    public List<Reunion> findAll() {
        return reunionRepository.findAll();
    }

    public Optional<Reunion> findById(Integer id) {
        return reunionRepository.findById(id);
    }

    public List<Reunion> findBySprint(Sprint sprint) {
        return reunionRepository.findBySprint(sprint);
    }

    public List<Reunion> findByTipoReunion(String tipoReunion) {
        return reunionRepository.findByTipoReunion(tipoReunion);
    }

    public List<Reunion> findByFechaDeReunion(LocalDate fecha) {
        return reunionRepository.findByFechaDeReunion(fecha);
    }

    public Reunion save(Reunion reunion) {
        return reunionRepository.save(reunion);
    }

    public void deleteById(Integer id) {
        reunionRepository.deleteById(id);
    }

    public boolean existsById(Integer id) {
        return reunionRepository.existsById(id);
    }
}
