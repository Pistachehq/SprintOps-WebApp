package com.pistache.sprintops_backend.service;

import com.pistache.sprintops_backend.model.Proyecto;
import com.pistache.sprintops_backend.model.Equipo;
import com.pistache.sprintops_backend.repository.ProyectoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class ProyectoService {

    @Autowired
    private ProyectoRepository proyectoRepository;

    public List<Proyecto> findAll() {
        return proyectoRepository.findAll();
    }

    public Optional<Proyecto> findById(Integer id) {
        return proyectoRepository.findById(id);
    }

    public Optional<Proyecto> findByNombreProyecto(String nombreProyecto) {
        return proyectoRepository.findByNombreProyecto(nombreProyecto);
    }

    public Optional<Proyecto> findByCodigoProyecto(String codigo) {
        return proyectoRepository.findByCodigoProyecto(codigo);
    }

    public List<Proyecto> findByEquipo(Equipo equipo) {
        return proyectoRepository.findByEquipo(equipo);
    }

    public List<Proyecto> findByEstadoDelProyecto(String estado) {
        return proyectoRepository.findByEstadoDelProyecto(estado);
    }

    public Proyecto save(Proyecto proyecto) {
        return proyectoRepository.save(proyecto);
    }

    public void deleteById(Integer id) {
        proyectoRepository.deleteById(id);
    }

    public boolean existsById(Integer id) {
        return proyectoRepository.existsById(id);
    }
}
