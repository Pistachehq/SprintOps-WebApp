package com.pistache.sprintops_backend.service;

import com.pistache.sprintops_backend.model.RegistroReunion;
import com.pistache.sprintops_backend.model.Reunion;
import com.pistache.sprintops_backend.model.Usuario;
import com.pistache.sprintops_backend.repository.RegistroReunionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class RegistroReunionService {

    @Autowired
    private RegistroReunionRepository registroReunionRepository;

    public List<RegistroReunion> findAll() {
        return registroReunionRepository.findAll();
    }

    public Optional<RegistroReunion> findById(Integer id) {
        return registroReunionRepository.findById(id);
    }

    public List<RegistroReunion> findByReunion(Reunion reunion) {
        return registroReunionRepository.findByReunion(reunion);
    }

    public List<RegistroReunion> findByUsuario(Usuario usuario) {
        return registroReunionRepository.findByUsuario(usuario);
    }

    public RegistroReunion save(RegistroReunion registroReunion) {
        return registroReunionRepository.save(registroReunion);
    }

    public void deleteById(Integer id) {
        registroReunionRepository.deleteById(id);
    }

    public boolean existsById(Integer id) {
        return registroReunionRepository.existsById(id);
    }
}
