package com.pistache.sprintops_backend.service;

import com.pistache.sprintops_backend.model.RetroSprint;
import com.pistache.sprintops_backend.model.Sprint;
import com.pistache.sprintops_backend.repository.RetroSprintRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class RetroSprintService {

    @Autowired
    private RetroSprintRepository retroSprintRepository;

    public List<RetroSprint> findAll() {
        return retroSprintRepository.findAll();
    }

    public Optional<RetroSprint> findById(Integer id) {
        return retroSprintRepository.findById(id);
    }

    public Optional<RetroSprint> findBySprint(Sprint sprint) {
        return retroSprintRepository.findBySprint(sprint);
    }

    public RetroSprint save(RetroSprint retroSprint) {
        return retroSprintRepository.save(retroSprint);
    }

    public void deleteById(Integer id) {
        retroSprintRepository.deleteById(id);
    }

    public boolean existsById(Integer id) {
        return retroSprintRepository.existsById(id);
    }
}
