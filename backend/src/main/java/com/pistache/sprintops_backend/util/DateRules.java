package com.pistache.sprintops_backend.util;

import com.pistache.sprintops_backend.model.Issues;
import com.pistache.sprintops_backend.model.Proyecto;
import com.pistache.sprintops_backend.model.Sprint;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

/**
 * Reglas de coherencia de fechas para Proyecto/Sprint/Issue.
 * Cualquier violación produce 400 con un mensaje legible en español.
 */
public final class DateRules {

    private DateRules() {}

    private static void bad(String msg) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, msg);
    }

    public static void requireProjectCreate(LocalDate start, LocalDate end) {
        if (start == null || end == null) bad("Las fechas de inicio y fin son obligatorias.");
        if (start.isBefore(LocalDate.now())) bad("La fecha de inicio del proyecto no puede ser anterior a hoy.");
        if (!end.isAfter(start)) bad("La fecha de fin del proyecto debe ser posterior a la de inicio.");
    }

    /** Validación para PUT de proyecto: end (y opcionalmente start) deben mantener coherencia con sprints e issues. */
    public static void requireProjectUpdate(
            Proyecto proyecto,
            LocalDate newStart,
            LocalDate newEnd,
            List<Sprint> sprints,
            List<Issues> issues) {

        LocalDate effectiveStart = newStart != null ? newStart : proyecto.getFechaInicioProyecto();
        LocalDate effectiveEnd = newEnd != null ? newEnd : proyecto.getFechaFinProyecto();

        if (effectiveStart != null && effectiveEnd != null && !effectiveEnd.isAfter(effectiveStart)) {
            bad("La fecha de fin del proyecto debe ser posterior a la de inicio.");
        }

        if (newEnd != null) {
            LocalDate maxSprintEnd = sprints.stream()
                    .map(Sprint::getFechaFinSprint)
                    .filter(d -> d != null)
                    .max(LocalDate::compareTo)
                    .orElse(null);
            if (maxSprintEnd != null && newEnd.isBefore(maxSprintEnd)) {
                bad("La fecha de fin del proyecto no puede ser anterior al fin del sprint más tardío (" + maxSprintEnd + ").");
            }
            LocalDate maxIssueEnd = issues.stream()
                    .map(Issues::getFechaFinIssue)
                    .filter(d -> d != null)
                    .max(LocalDate::compareTo)
                    .orElse(null);
            if (maxIssueEnd != null && newEnd.isBefore(maxIssueEnd)) {
                bad("La fecha de fin del proyecto no puede ser anterior al fin de la issue más tardía (" + maxIssueEnd + ").");
            }
        }
    }

    /**
     * Validación para Sprint (create o update). `excludeSprintId` evita comparar el sprint consigo mismo en update.
     */
    public static void requireSprintRange(
            Proyecto proyecto,
            LocalDate start,
            LocalDate end,
            List<Sprint> sprintsDelProyecto,
            Integer excludeSprintId) {

        if (start == null || end == null) bad("Las fechas de inicio y fin del sprint son obligatorias.");
        if (!end.isAfter(start)) bad("La fecha de fin del sprint debe ser posterior a la de inicio.");

        LocalDate projectStart = proyecto.getFechaInicioProyecto();
        LocalDate projectEnd = proyecto.getFechaFinProyecto();
        if (projectStart != null && start.isBefore(projectStart)) {
            bad("La fecha de inicio del sprint no puede ser anterior al inicio del proyecto (" + projectStart + ").");
        }
        if (projectEnd != null && end.isAfter(projectEnd)) {
            bad("La fecha de fin del sprint no puede ser posterior al fin del proyecto (" + projectEnd + ").");
        }

        for (Sprint other : sprintsDelProyecto) {
            if (excludeSprintId != null && excludeSprintId.equals(other.getIdSprint())) continue;
            LocalDate os = other.getFechaInicioSprint();
            LocalDate oe = other.getFechaFinSprint();
            if (os == null || oe == null) continue;
            boolean overlap = !start.isAfter(oe) && !os.isAfter(end);
            if (overlap) {
                String name = other.getNombreSprint() != null ? other.getNombreSprint() : ("#" + other.getIdSprint());
                bad("El rango se solapa con el sprint \"" + name + "\" (" + os + " — " + oe + ").");
            }
        }
    }

    /**
     * Validación para Issue (create o update). `isCreate` aplica la regla "no anterior a hoy" sólo en alta.
     */
    public static void requireIssueEnd(
            LocalDate endDate,
            boolean isCreate,
            Proyecto proyecto,
            Sprint sprint) {

        if (endDate == null) return; // endDate opcional
        if (isCreate && endDate.isBefore(LocalDate.now())) {
            bad("La fecha fin de la issue no puede ser anterior a hoy.");
        }
        if (proyecto != null && proyecto.getFechaFinProyecto() != null && endDate.isAfter(proyecto.getFechaFinProyecto())) {
            bad("La fecha fin de la issue no puede ser posterior al fin del proyecto (" + proyecto.getFechaFinProyecto() + ").");
        }
        if (sprint != null && sprint.getFechaInicioSprint() != null && endDate.isBefore(sprint.getFechaInicioSprint())) {
            bad("La fecha fin de la issue no puede ser anterior al inicio del sprint (" + sprint.getFechaInicioSprint() + ").");
        }
        if (sprint != null && sprint.getFechaFinSprint() != null && endDate.isAfter(sprint.getFechaFinSprint())) {
            bad("La fecha fin de la issue no puede ser posterior al fin del sprint (" + sprint.getFechaFinSprint() + ").");
        }
    }
}
