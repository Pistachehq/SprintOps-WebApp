package com.pistache.sprintops_backend.service;

import com.pistache.sprintops_backend.model.Issues;
import com.pistache.sprintops_backend.model.Proyecto;
import com.pistache.sprintops_backend.repository.IssuesRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class IssuesService {

    @Autowired
    private IssuesRepository issuesRepository;

    public List<Issues> findAll() {
        return issuesRepository.findAll();
    }

    public Optional<Issues> findById(Integer id) {
        return issuesRepository.findById(id);
    }

    public List<Issues> findByProyecto(Proyecto proyecto) {
        return issuesRepository.findByProyecto(proyecto);
    }

    public List<Issues> findByEstadoIssue(String estado) {
        return issuesRepository.findByEstadoIssue(estado);
    }

    public List<Issues> findByPrioridadIssue(String prioridad) {
        return issuesRepository.findByPrioridadIssue(prioridad);
    }

    public List<Issues> findByProyectoAndEstadoIssue(Proyecto proyecto, String estado) {
        return issuesRepository.findByProyectoAndEstadoIssue(proyecto, estado);
    }

    public Issues save(Issues issues) {
        return issuesRepository.save(issues);
    }

    public void deleteById(Integer id) {
        issuesRepository.deleteById(id);
    }

    public boolean existsById(Integer id) {
        return issuesRepository.existsById(id);
    }
}
