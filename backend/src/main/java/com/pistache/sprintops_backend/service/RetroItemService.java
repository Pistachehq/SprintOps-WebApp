package com.pistache.sprintops_backend.service;

import com.pistache.sprintops_backend.model.RetroItem;
import com.pistache.sprintops_backend.model.RetroSprint;
import com.pistache.sprintops_backend.repository.RetroItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class RetroItemService {

    @Autowired
    private RetroItemRepository retroItemRepository;

    public List<RetroItem> findAll() {
        return retroItemRepository.findAll();
    }

    public Optional<RetroItem> findById(Integer id) {
        return retroItemRepository.findById(id);
    }

    public List<RetroItem> findByRetroSprint(RetroSprint retroSprint) {
        return retroItemRepository.findByRetroSprint(retroSprint);
    }

    public RetroItem save(RetroItem retroItem) {
        return retroItemRepository.save(retroItem);
    }

    public void deleteById(Integer id) {
        retroItemRepository.deleteById(id);
    }

    public boolean existsById(Integer id) {
        return retroItemRepository.existsById(id);
    }
}
