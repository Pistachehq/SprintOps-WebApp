package com.pistache.sprintops_backend.service;

import com.pistache.sprintops_backend.model.Metodologia;
import com.pistache.sprintops_backend.model.Proyecto;
import com.pistache.sprintops_backend.repository.MetodologiaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class MetodologiaService {

    @Autowired
    private MetodologiaRepository metodologiaRepository;

    public List<Metodologia> findAll() {
        return metodologiaRepository.findAll();
    }

    public Optional<Metodologia> findById(Integer id) {
        return metodologiaRepository.findById(id);
    }

    public Optional<Metodologia> findByProyecto(Proyecto proyecto) {
        return metodologiaRepository.findByProyecto(proyecto);
    }

    public Optional<Metodologia> findByNombreMetodologia(String nombreMetodologia) {
        return metodologiaRepository.findByNombreMetodologia(nombreMetodologia);
    }

    public Metodologia save(Metodologia metodologia) {
        return metodologiaRepository.save(metodologia);
    }

    public void deleteById(Integer id) {
        metodologiaRepository.deleteById(id);
    }

    public boolean existsById(Integer id) {
        return metodologiaRepository.existsById(id);
    }
}
