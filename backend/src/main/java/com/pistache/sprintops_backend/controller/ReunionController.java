package com.pistache.sprintops_backend.controller;

import com.pistache.sprintops_backend.model.Reunion;
import com.pistache.sprintops_backend.model.RegistroReunion;
import com.pistache.sprintops_backend.repository.ReunionRepository;
import com.pistache.sprintops_backend.repository.RegistroReunionRepository;
import com.pistache.sprintops_backend.service.ReunionService;
import com.pistache.sprintops_backend.service.SprintService;
import com.pistache.sprintops_backend.service.UsuarioService;
import com.pistache.sprintops_backend.repository.RolesDeUsuariosRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reuniones")
@CrossOrigin(origins = "*")
public class ReunionController {

    @Autowired
    private ReunionService reunionService;
    @Autowired
    private ReunionRepository reunionRepository;
    @Autowired
    private RegistroReunionRepository registroReunionRepository;
    @Autowired
    private SprintService sprintService;
    @Autowired
    private UsuarioService usuarioService;
    @Autowired
    private RolesDeUsuariosRepository rolesDeUsuariosRepository;

    private static Integer projectIdFromReunion(Reunion r) {
        if (r.getProyecto() != null) {
            return r.getProyecto().getIdProyecto();
        }
        if (r.getSprint() != null && r.getSprint().getProyecto() != null) {
            return r.getSprint().getProyecto().getIdProyecto();
        }
        return null;
    }

    @GetMapping
    public List<Reunion> getAll() {
        return reunionService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Reunion> getById(@PathVariable Integer id) {
        return reunionService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/sprint/{sprintId}")
    public List<Map<String, Object>> getBySprintId(@PathVariable Integer sprintId) {
        return reunionRepository.findBySprintIdSprintOrderByFechaDeReunionDesc(sprintId).stream()
                .map(r -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", r.getIdReunion());
                    map.put("type", r.getTipoReunion());
                    map.put("date", r.getFechaDeReunion().toString());
                    map.put("sprintId", sprintId);
                    map.put("projectId", projectIdFromReunion(r));
                    return map;
                })
                .collect(Collectors.toList());
    }

    @PostMapping("/daily")
    public ResponseEntity<Map<String, Object>> getOrCreateDaily(@RequestBody Map<String, Object> body) {
        Integer sprintId = (Integer) body.get("sprintId");
        Integer userId = (Integer) body.get("userId");
        if (sprintId == null || userId == null) {
            return ResponseEntity.badRequest().build();
        }

        LocalDate today = LocalDate.now();

        Reunion reunion = reunionRepository
                .findBySprintIdSprintAndFechaDeReunionAndTipoReunion(sprintId, today, "Daily")
                .orElseGet(() -> {
                    var optSprint = sprintService.findById(sprintId);
                    if (optSprint.isEmpty()) return null;
                    Reunion r = new Reunion();
                    r.setTipoReunion("Daily");
                    r.setFechaDeReunion(today);
                    var sp = optSprint.get();
                    r.setSprint(sp);
                    if (sp.getProyecto() != null) {
                        r.setProyecto(sp.getProyecto());
                    }
                    return reunionService.save(r);
                });

        if (reunion == null) {
            return ResponseEntity.notFound().build();
        }

        Optional<RegistroReunion> existingRegistro = registroReunionRepository
                .findByReunionIdReunionAndUsuarioIdUsuario(reunion.getIdReunion(), userId);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("reunionId", reunion.getIdReunion());
        result.put("date", reunion.getFechaDeReunion().toString());
        result.put("sprintId", sprintId);
        result.put("projectId", projectIdFromReunion(reunion));

        if (existingRegistro.isPresent()) {
            RegistroReunion reg = existingRegistro.get();
            result.put("registroId", reg.getIdRegistro());
            result.put("done", reg.getQueHice());
            result.put("doing", reg.getQueHare());
            result.put("blockers", reg.getImpedimentos());
            if (reg.getFechaHoraRegistro() != null) {
                result.put("savedAt", reg.getFechaHoraRegistro().toString());
            }
        } else {
            result.put("registroId", null);
            result.put("done", "");
            result.put("doing", "");
            result.put("blockers", "");
        }

        return ResponseEntity.ok(result);
    }

    /**
     * Dailies del sprint agrupadas por fecha (solo días dentro de la vigencia inicio–fin del sprint).
     */
    @GetMapping("/daily/team/{sprintId}")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getTeamDailyBySprint(@PathVariable Integer sprintId) {
        var optSprint = sprintService.findById(sprintId);
        if (optSprint.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        var sp = optSprint.get();
        Integer equipoId = null;
        if (sp.getProyecto() != null && sp.getProyecto().getEquipo() != null) {
            equipoId = sp.getProyecto().getEquipo().getIdEquipo();
        }

        List<Reunion> dailies =
                reunionRepository.findBySprintIdSprintAndTipoReunionOrderByFechaDeReunionDesc(sprintId, "Daily");

        LocalDate sprintStart = sp.getFechaInicioSprint();
        LocalDate sprintEnd = sp.getFechaFinSprint();
        if (sprintStart != null && sprintEnd != null) {
            LocalDate from = sprintStart;
            LocalDate to = sprintEnd;
            if (to.isBefore(from)) {
                from = sprintEnd;
                to = sprintStart;
            }
            LocalDate a = from;
            LocalDate b = to;
            dailies = dailies.stream()
                    .filter(r -> r.getFechaDeReunion() != null
                            && !r.getFechaDeReunion().isBefore(a)
                            && !r.getFechaDeReunion().isAfter(b))
                    .collect(Collectors.toList());
        } else if (sprintStart != null) {
            LocalDate a = sprintStart;
            dailies = dailies.stream()
                    .filter(r -> r.getFechaDeReunion() != null && !r.getFechaDeReunion().isBefore(a))
                    .collect(Collectors.toList());
        } else if (sprintEnd != null) {
            LocalDate b = sprintEnd;
            dailies = dailies.stream()
                    .filter(r -> r.getFechaDeReunion() != null && !r.getFechaDeReunion().isAfter(b))
                    .collect(Collectors.toList());
        }

        List<Map<String, Object>> days = new ArrayList<>();
        for (Reunion r : dailies) {
            List<RegistroReunion> regs = registroReunionRepository.findByReunion(r);
            if (regs.isEmpty()) {
                continue;
            }
            List<Map<String, Object>> entries = new ArrayList<>();
            for (RegistroReunion reg : regs) {
                var u = reg.getUsuario();
                if (u == null) {
                    continue;
                }
                String roleLabel = "Miembro";
                if (equipoId != null) {
                    var roleRow = rolesDeUsuariosRepository.findByEquipo_IdEquipoAndUsuario_IdUsuario(
                            equipoId, u.getIdUsuario());
                    if (roleRow.isPresent() && roleRow.get().getRol() != null) {
                        roleLabel = roleRow.get().getRol().getNombreRol();
                    }
                }
                Map<String, Object> e = new LinkedHashMap<>();
                e.put("userId", u.getIdUsuario());
                e.put("userName", u.getNombreUsuario() != null ? u.getNombreUsuario() : "");
                e.put("roleLabel", roleLabel);
                e.put("savedAt", reg.getFechaHoraRegistro() != null ? reg.getFechaHoraRegistro().toString() : null);
                e.put("done", reg.getQueHice() != null ? reg.getQueHice() : "");
                e.put("doing", reg.getQueHare() != null ? reg.getQueHare() : "");
                e.put("blockers", reg.getImpedimentos() != null ? reg.getImpedimentos() : "");
                entries.add(e);
            }
            if (entries.isEmpty()) {
                continue;
            }
            entries.sort(Comparator.comparing(m -> String.valueOf(m.get("userName")).toLowerCase(Locale.ROOT)));
            Map<String, Object> day = new LinkedHashMap<>();
            day.put("date", r.getFechaDeReunion().toString());
            day.put("reunionId", r.getIdReunion());
            day.put("entries", entries);
            days.add(day);
        }
        return ResponseEntity.ok(days);
    }

    @PostMapping("/daily/save")
    public ResponseEntity<Map<String, Object>> saveDaily(@RequestBody Map<String, Object> body) {
        Integer reunionId = (Integer) body.get("reunionId");
        Integer userId = (Integer) body.get("userId");
        String done = (String) body.get("done");
        String doing = (String) body.get("doing");
        String blockers = (String) body.get("blockers");

        if (reunionId == null || userId == null) {
            return ResponseEntity.badRequest().build();
        }

        var optReunion = reunionService.findById(reunionId);
        var optUser = usuarioService.findById(userId);
        if (optReunion.isEmpty() || optUser.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        RegistroReunion registro = registroReunionRepository
                .findByReunionIdReunionAndUsuarioIdUsuario(reunionId, userId)
                .orElse(new RegistroReunion());

        registro.setQueHice(done != null ? done : "");
        registro.setQueHare(doing != null ? doing : "");
        registro.setImpedimentos(blockers != null ? blockers : "");
        registro.setReunion(optReunion.get());
        registro.setUsuario(optUser.get());
        registro.setFechaHoraRegistro(LocalDateTime.now());

        registro = registroReunionRepository.save(registro);

        Reunion reunion = optReunion.get();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("registroId", registro.getIdRegistro());
        result.put("reunionId", reunionId);
        result.put("date", reunion.getFechaDeReunion().toString());
        result.put("sprintId", reunion.getSprint() != null ? reunion.getSprint().getIdSprint() : null);
        result.put("projectId", projectIdFromReunion(reunion));
        result.put("userId", userId);
        result.put("savedAt", registro.getFechaHoraRegistro().toString());
        result.put("done", registro.getQueHice());
        result.put("doing", registro.getQueHare());
        result.put("blockers", registro.getImpedimentos());

        return ResponseEntity.ok(result);
    }

    @PostMapping
    public Reunion create(@RequestBody Reunion reunion) {
        return reunionService.save(reunion);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        if (!reunionService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        reunionService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
