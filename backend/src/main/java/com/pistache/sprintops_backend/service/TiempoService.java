package com.pistache.sprintops_backend.service;

import com.pistache.sprintops_backend.model.DescIssue;
import com.pistache.sprintops_backend.model.Issues;
import com.pistache.sprintops_backend.model.Proyecto;
import com.pistache.sprintops_backend.model.RegistroTiempo;
import com.pistache.sprintops_backend.model.Sprint;
import com.pistache.sprintops_backend.model.Usuario;
import com.pistache.sprintops_backend.repository.DescIssueRepository;
import com.pistache.sprintops_backend.repository.IssuesRepository;
import com.pistache.sprintops_backend.repository.RegistroTiempoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class TiempoService {

    @Autowired
    private ProyectoService proyectoService;
    @Autowired
    private UsuarioService usuarioService;
    @Autowired
    private IssuesRepository issuesRepository;
    @Autowired
    private DescIssueRepository descIssueRepository;
    @Autowired
    private RegistroTiempoRepository registroTiempoRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> reporte(Integer projectId) {
        Proyecto proyecto = proyectoService.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Proyecto no encontrado"));
        boolean modoTiempo = "tiempo".equalsIgnoreCase(proyecto.getModoProyecto());

        List<Issues> issues = issuesRepository.findAllBelongingToProject(projectId);
        List<Integer> issueIds = issues.stream().map(Issues::getIdIssue).toList();
        List<RegistroTiempo> logs = issueIds.isEmpty()
                ? List.of()
                : registroTiempoRepository.findByIssue_IdIssueIn(issueIds);

        Map<Integer, BigDecimal> realesPorIssue = new LinkedHashMap<>();
        Map<Integer, MemberHours> porMiembro = new LinkedHashMap<>();
        for (RegistroTiempo log : logs) {
            Integer issueId = log.getIssue().getIdIssue();
            realesPorIssue.merge(issueId, nz(log.getHoras()), BigDecimal::add);
            if (log.getUsuario() != null) {
                Integer userId = log.getUsuario().getIdUsuario();
                porMiembro.computeIfAbsent(userId, id -> new MemberHours(
                        id,
                        log.getUsuario().getNombreUsuario()
                )).horas = porMiembro.get(userId).horas.add(nz(log.getHoras()));
            }
        }

        Map<String, BigDecimal> porSprint = new LinkedHashMap<>();
        List<Map<String, Object>> porTarea = new ArrayList<>();
        BigDecimal horasEstimadas = BigDecimal.ZERO;
        BigDecimal horasReales = BigDecimal.ZERO;

        for (Issues issue : issues) {
            BigDecimal estimadas = nz(issue.getHorasEstimadas());
            BigDecimal reales = nz(realesPorIssue.get(issue.getIdIssue()));
            horasEstimadas = horasEstimadas.add(estimadas);
            horasReales = horasReales.add(reales);
            Sprint sprint = sprintActual(issue);
            String sprintName = sprint != null && sprint.getNombreSprint() != null
                    ? sprint.getNombreSprint()
                    : "Sin sprint";
            porSprint.merge(sprintName, reales, BigDecimal::add);

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("issueId", issue.getIdIssue());
            row.put("title", issue.getTituloIssue());
            row.put("sprintName", sprintName);
            row.put("horasEstimadas", scale(estimadas));
            row.put("horasReales", scale(reales));
            porTarea.add(row);
        }
        porTarea.sort(Comparator.comparing((Map<String, Object> row) -> (String) row.get("sprintName"))
                .thenComparing(row -> String.valueOf(row.get("title"))));

        List<Map<String, Object>> miembros = porMiembro.values().stream()
                .sorted(Comparator.comparing(m -> m.name == null ? "" : m.name))
                .map(m -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("userId", m.userId);
                    row.put("name", m.name);
                    row.put("horas", scale(m.horas));
                    return row;
                })
                .toList();

        List<Map<String, Object>> sprints = new ArrayList<>();
        porSprint.forEach((name, horas) -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("sprintName", name);
            row.put("horas", scale(horas));
            sprints.add(row);
        });

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("modo", modoTiempo ? "tiempo" : "agil");
        body.put("cotizacionHabilitada", Boolean.TRUE.equals(proyecto.getCotizacionHabilitada()));
        body.put("tarifaHora", proyecto.getTarifaHora());
        body.put("margenUtilidad", proyecto.getMargenUtilidad());
        body.put("horasEstimadas", scale(horasEstimadas));
        body.put("horasReales", scale(horasReales));
        body.put("porTarea", porTarea);
        body.put("porMiembro", miembros);
        body.put("porSprint", sprints);
        body.put("cotizacion", cotizacion(proyecto, horasReales));
        return body;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> logsDeIssue(Integer issueId) {
        return registroTiempoRepository
                .findByIssue_IdIssueOrderByFechaDescIdRegistroTiempoDesc(issueId)
                .stream()
                .map(this::logDto)
                .toList();
    }

    @Transactional
    public Map<String, Object> registrar(Integer issueId, Integer userId, BigDecimal horas, LocalDate fecha, String nota) {
        if (horas == null || horas.signum() <= 0 || horas.compareTo(new BigDecimal("24")) > 0) {
            throw new IllegalArgumentException("Las horas deben ser mayores a 0 y como máximo 24.");
        }
        Issues issue = issuesRepository.findById(issueId)
                .orElseThrow(() -> new IllegalArgumentException("Tarea no encontrada"));
        Proyecto proyecto = proyectoDe(issue);
        if (proyecto == null || !"tiempo".equalsIgnoreCase(proyecto.getModoProyecto())) {
            throw new IllegalArgumentException("Este proyecto no está en modo gestión por tiempo.");
        }
        Usuario usuario = usuarioService.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        RegistroTiempo log = new RegistroTiempo();
        log.setIssue(issue);
        log.setUsuario(usuario);
        log.setHoras(horas.setScale(2, RoundingMode.HALF_UP));
        log.setFecha(fecha != null ? fecha : LocalDate.now());
        log.setNota(nota == null ? null : nota.trim());
        log = registroTiempoRepository.save(log);
        return logDto(log);
    }

    @Transactional
    public Proyecto actualizarCotizacion(Integer projectId, BigDecimal tarifaHora, BigDecimal margenUtilidad) {
        Proyecto proyecto = proyectoService.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Proyecto no encontrado"));
        if (!"tiempo".equalsIgnoreCase(proyecto.getModoProyecto())
                || !Boolean.TRUE.equals(proyecto.getCotizacionHabilitada())) {
            throw new IllegalArgumentException("Este proyecto no tiene recomendaciones de cotización.");
        }
        if (tarifaHora != null && tarifaHora.signum() < 0) {
            throw new IllegalArgumentException("La tarifa por hora no puede ser negativa.");
        }
        if (margenUtilidad != null && (margenUtilidad.signum() < 0 || margenUtilidad.compareTo(new BigDecimal("100")) > 0)) {
            throw new IllegalArgumentException("El margen debe estar entre 0 y 100.");
        }
        proyecto.setTarifaHora(tarifaHora == null ? null : tarifaHora.setScale(2, RoundingMode.HALF_UP));
        proyecto.setMargenUtilidad(margenUtilidad == null ? null : margenUtilidad.setScale(2, RoundingMode.HALF_UP));
        return proyectoService.save(proyecto);
    }

    private Map<String, Object> cotizacion(Proyecto proyecto, BigDecimal horasReales) {
        if (!"tiempo".equalsIgnoreCase(proyecto.getModoProyecto())
                || !Boolean.TRUE.equals(proyecto.getCotizacionHabilitada())) {
            return null;
        }
        Map<String, Object> quote = new LinkedHashMap<>();
        quote.put("horas", scale(horasReales));
        quote.put("tarifaHora", proyecto.getTarifaHora());
        BigDecimal margen = proyecto.getMargenUtilidad() == null ? new BigDecimal("20") : proyecto.getMargenUtilidad();
        quote.put("margenUtilidad", margen);
        if (proyecto.getTarifaHora() == null || horasReales.signum() == 0) {
            quote.put("costo", null);
            quote.put("precioSugerido", null);
            quote.put("precioMin", null);
            quote.put("precioMax", null);
            return quote;
        }
        BigDecimal costo = horasReales.multiply(proyecto.getTarifaHora());
        BigDecimal factor = BigDecimal.ONE.add(margen.divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP));
        BigDecimal precio = costo.multiply(factor);
        quote.put("costo", scale(costo));
        quote.put("precioSugerido", scale(precio));
        quote.put("precioMin", scale(precio.multiply(new BigDecimal("0.90"))));
        quote.put("precioMax", scale(precio.multiply(new BigDecimal("1.15"))));
        return quote;
    }

    private Proyecto proyectoDe(Issues issue) {
        if (issue.getProyecto() != null) return issue.getProyecto();
        return descIssueRepository.findByIssueIdIssue(issue.getIdIssue()).stream()
                .map(d -> d.getSprint() != null ? d.getSprint().getProyecto() : null)
                .filter(p -> p != null)
                .findFirst()
                .orElse(null);
    }

    private Sprint sprintActual(Issues issue) {
        List<DescIssue> links = descIssueRepository.findByIssueIdIssue(issue.getIdIssue());
        return links.stream()
                .filter(d -> d.getFechaSalida() == null && d.getSprint() != null)
                .map(DescIssue::getSprint)
                .findFirst()
                .orElseGet(() -> links.stream()
                        .map(DescIssue::getSprint)
                        .filter(s -> s != null)
                        .reduce((first, second) -> second)
                        .orElse(null));
    }

    private Map<String, Object> logDto(RegistroTiempo log) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", log.getIdRegistroTiempo());
        row.put("issueId", log.getIssue().getIdIssue());
        row.put("userId", log.getUsuario().getIdUsuario());
        row.put("userName", log.getUsuario().getNombreUsuario());
        row.put("horas", scale(log.getHoras()));
        row.put("fecha", log.getFecha());
        row.put("nota", log.getNota());
        return row;
    }

    private static BigDecimal nz(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private static BigDecimal scale(BigDecimal value) {
        return nz(value).setScale(2, RoundingMode.HALF_UP);
    }

    private static final class MemberHours {
        private final Integer userId;
        private final String name;
        private BigDecimal horas = BigDecimal.ZERO;

        private MemberHours(Integer userId, String name) {
            this.userId = userId;
            this.name = name;
        }
    }
}
