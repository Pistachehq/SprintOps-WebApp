package com.pistache.sprintops_backend.util;

import com.pistache.sprintops_backend.model.Sprint;

import java.time.LocalDate;
import java.util.List;

public final class ScheduleDates {

    public static final int HORIZON_YEARS = 3;

    private ScheduleDates() {}

    public static String projectRangeError(LocalDate start, LocalDate end) {
        if (start == null || end == null) {
            return "Indica la fecha de inicio y la de fin.";
        }
        LocalDate today = LocalDate.now();
        LocalDate max = today.plusYears(HORIZON_YEARS);
        if (start.isBefore(today)) {
            return "El proyecto empieza hoy o después.";
        }
        if (start.isAfter(max)) {
            return "La fecha de inicio no puede pasar de " + max + ".";
        }
        if (end.isBefore(start)) {
            return "La fecha de fin es el mismo día de inicio o después.";
        }
        if (end.isAfter(max)) {
            return "La fecha de fin no puede pasar de " + max + ".";
        }
        return null;
    }

    public static String projectEndUpdateError(LocalDate start, LocalDate end, LocalDate latestSprintEnd) {
        if (end == null) {
            return "Indica la fecha de fin.";
        }
        if (start != null && end.isBefore(start)) {
            return "La fecha de fin es el mismo día de inicio o después.";
        }
        LocalDate maxBase = start != null && start.isAfter(LocalDate.now()) ? start : LocalDate.now();
        LocalDate max = maxBase.plusYears(HORIZON_YEARS);
        if (end.isAfter(max)) {
            return "La fecha de fin no puede pasar de " + max + ".";
        }
        if (latestSprintEnd != null && end.isBefore(latestSprintEnd)) {
            return "La fecha de fin del proyecto no puede quedar antes de que termine el último sprint (" + latestSprintEnd + ").";
        }
        return null;
    }

    public static String sprintRangeError(
            LocalDate start,
            LocalDate end,
            LocalDate projectStart,
            LocalDate projectEnd,
            List<Sprint> existing) {
        if (start == null || end == null) {
            return "Indica la fecha de inicio y la fecha final del sprint.";
        }
        if (end.isBefore(start)) {
            return "La fecha final del sprint es el mismo día de inicio o después.";
        }
        if (projectEnd != null && end.isAfter(projectEnd)) {
            return "El sprint no puede terminar después del proyecto (" + projectEnd + ").";
        }
        LocalDate lastEnd = null;
        if (existing != null) {
            for (Sprint sprint : existing) {
                LocalDate marker = sprint.getFechaFinSprint() != null
                        ? sprint.getFechaFinSprint()
                        : sprint.getFechaInicioSprint();
                if (marker != null && (lastEnd == null || marker.isAfter(lastEnd))) {
                    lastEnd = marker;
                }
            }
        }
        if (lastEnd == null) {
            if (projectStart != null && start.isBefore(projectStart)) {
                return "El primer sprint empieza el día de inicio del proyecto (" + projectStart + ") o después.";
            }
            return null;
        }
        LocalDate nextStart = lastEnd.plusDays(1);
        if (!start.equals(nextStart)) {
            return "El siguiente sprint empieza el " + nextStart + ", el día después de que termina el anterior.";
        }
        return null;
    }

    public static String issueEndError(LocalDate end, LocalDate sprintStart, LocalDate sprintEnd) {
        if (end == null) {
            return null;
        }
        if (sprintStart != null && end.isBefore(sprintStart)) {
            return "La fecha de la tarea tiene que caer dentro del sprint (" + sprintStart + " a " + sprintEnd + ").";
        }
        if (sprintEnd != null && end.isAfter(sprintEnd)) {
            return "La fecha de la tarea tiene que caer dentro del sprint (" + sprintStart + " a " + sprintEnd + ").";
        }
        return null;
    }
}
