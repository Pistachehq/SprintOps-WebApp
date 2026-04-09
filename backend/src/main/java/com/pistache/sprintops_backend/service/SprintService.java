package com.pistache.sprintops_backend.service;

import com.pistache.sprintops_backend.model.Sprint;
import com.pistache.sprintops_backend.model.Proyecto;
import com.pistache.sprintops_backend.repository.SprintRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class SprintService {

    @Autowired
    private SprintRepository sprintRepository;

    public List<Sprint> findAll() {
        return sprintRepository.findAll();
    }

    public Optional<Sprint> findById(Integer id) {
        return sprintRepository.findById(id);
    }

    public List<Sprint> findByProyecto(Proyecto proyecto) {
        return sprintRepository.findByProyecto(proyecto);
    }

    public List<Sprint> findByEstadoDelSprint(String estado) {
        return sprintRepository.findByEstadoDelSprint(estado);
    }

    public List<Sprint> findByProyectoAndEstadoDelSprint(Proyecto proyecto, String estado) {
        return sprintRepository.findByProyectoAndEstadoDelSprint(proyecto, estado);
    }

    public Sprint save(Sprint sprint) {
        return sprintRepository.save(sprint);
    }

    public void deleteById(Integer id) {
        sprintRepository.deleteById(id);
    }

    public boolean existsById(Integer id) {
        return sprintRepository.existsById(id);
    }
}
