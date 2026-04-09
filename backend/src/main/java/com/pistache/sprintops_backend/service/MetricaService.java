package com.pistache.sprintops_backend.service;

import com.pistache.sprintops_backend.model.Metrica;
import com.pistache.sprintops_backend.repository.MetricaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class MetricaService {

    @Autowired
    private MetricaRepository metricaRepository;

    public List<Metrica> findAll() {
        return metricaRepository.findAll();
    }

    public Optional<Metrica> findById(Integer id) {
        return metricaRepository.findById(id);
    }

    public Optional<Metrica> findByNombreMetrica(String nombreMetrica) {
        return metricaRepository.findByNombreMetrica(nombreMetrica);
    }

    public Metrica save(Metrica metrica) {
        return metricaRepository.save(metrica);
    }

    public void deleteById(Integer id) {
        metricaRepository.deleteById(id);
    }

    public boolean existsById(Integer id) {
        return metricaRepository.existsById(id);
    }
}
