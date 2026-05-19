package com.pistache.sprintops_backend.service.telegram;

import com.pistache.sprintops_backend.model.InfoUsuarioEquipo;
import com.pistache.sprintops_backend.model.Proyecto;
import com.pistache.sprintops_backend.model.Usuario;
import com.pistache.sprintops_backend.repository.InfoUsuarioEquipoRepository;
import com.pistache.sprintops_backend.repository.ProyectoRepository;
import com.pistache.sprintops_backend.repository.UsuarioRepository;
import com.pistache.sprintops_backend.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class TelegramProjectContextService {

    @Autowired
    private UsuarioRepository usuarioRepository;
    @Autowired
    private UsuarioService usuarioService;
    @Autowired
    private InfoUsuarioEquipoRepository infoUsuarioEquipoRepository;
    @Autowired
    private ProyectoRepository proyectoRepository;

    public List<Proyecto> proyectosAccesibles(Integer userId) {
        List<Proyecto> out = new ArrayList<>();
        if (userId == null) {
            return out;
        }
        Map<Integer, Proyecto> seen = new LinkedHashMap<>();
        for (InfoUsuarioEquipo link : infoUsuarioEquipoRepository.findByUsuarioIdUsuario(userId)) {
            if (link.getEquipo() == null) {
                continue;
            }
            for (Proyecto p : proyectoRepository.findByEquipo(link.getEquipo())) {
                seen.putIfAbsent(p.getIdProyecto(), p);
            }
        }
        out.addAll(seen.values());
        return out;
    }

    public boolean puedeVerProyecto(Integer userId, Integer projectId) {
        if (userId == null || projectId == null) {
            return false;
        }
        return proyectosAccesibles(userId).stream().anyMatch(p -> projectId.equals(p.getIdProyecto()));
    }

    @Transactional
    public String setProyectoTelegram(Long telegramUserId, Integer projectId) {
        Optional<Usuario> opt = usuarioRepository.findByTelegramUserId(telegramUserId);
        if (opt.isEmpty()) {
            return "Primero vincula tu cuenta: genera un código en la web y /vincular CODIGO";
        }
        Usuario u = opt.get();
        if (projectId == null) {
            u.setTelegramProyectoId(null);
            usuarioService.save(u);
            return "Contexto de proyecto borrado. Usa /misproyectos y luego /proyecto ID.";
        }
        if (!puedeVerProyecto(u.getIdUsuario(), projectId)) {
            return "No tienes acceso a ese proyecto o el id no existe.";
        }
        u.setTelegramProyectoId(projectId);
        usuarioService.save(u);
        Optional<Proyecto> p = proyectoRepository.findById(projectId);
        String nombre = p.map(Proyecto::getNombreProyecto).orElse("proyecto " + projectId);
        return "Proyecto activo para este chat: " + nombre + " (id " + projectId + "). Ya puedes escribir al asistente.";
    }

    @Transactional
    public void setTelegramPhone(Long telegramUserId, String phoneE164) {
        if (telegramUserId == null || phoneE164 == null || phoneE164.isBlank()) {
            return;
        }
        usuarioRepository.findByTelegramUserId(telegramUserId).ifPresent(u -> {
            u.setTelegramPhone(phoneE164.trim());
            usuarioService.save(u);
        });
    }
}
