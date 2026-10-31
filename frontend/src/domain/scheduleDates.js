export const PROJECT_HORIZON_YEARS = 3;

export function toIso(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseIso(iso) {
  const [year, month, day] = String(iso).split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function todayIso() {
  return toIso(new Date());
}

export function addDays(iso, days) {
  const date = parseIso(iso);
  date.setDate(date.getDate() + days);
  return toIso(date);
}

export function addYears(iso, years) {
  const date = parseIso(iso);
  date.setFullYear(date.getFullYear() + years);
  return toIso(date);
}

export function formatLong(iso) {
  if (!iso) return '';
  return parseIso(iso).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function projectDateBounds(startValue) {
  const today = todayIso();
  const max = addYears(today, PROJECT_HORIZON_YEARS);
  const endMin = startValue && startValue > today ? startValue : today;
  return { startMin: today, startMax: max, endMin, endMax: max };
}

function latestSprintEnd(sprints) {
  const ends = (sprints || [])
    .map((sprint) => sprint.endDate || sprint.startDate)
    .filter(Boolean)
    .sort();
  return ends.length ? ends[ends.length - 1] : '';
}

/** Primer sprint: desde el inicio del proyecto. Los siguientes empiezan el día después del anterior. */
export function nextSprintWindow(project, sprints) {
  const today = todayIso();
  const projectStart = project?.start || today;
  const horizon = addYears(projectStart > today ? projectStart : today, PROJECT_HORIZON_YEARS);
  const projectEnd = project?.end || horizon;
  const lastEnd = latestSprintEnd(sprints);

  if (!lastEnd) {
    const blocked = projectStart > projectEnd;
    return {
      blocked,
      blockedReason: blocked
        ? 'La fecha de fin del proyecto es anterior al inicio.'
        : '',
      startLocked: false,
      startMin: projectStart,
      startMax: projectEnd,
      endMax: projectEnd,
    };
  }

  const nextStart = addDays(lastEnd, 1);
  if (nextStart > projectEnd) {
    return {
      blocked: true,
      blockedReason: `El último sprint termina el ${formatLong(lastEnd)} y el proyecto el ${formatLong(projectEnd)}. Amplía la fecha de fin del proyecto para crear otro sprint.`,
      startLocked: true,
      startMin: nextStart,
      startMax: nextStart,
      endMax: projectEnd,
    };
  }

  return {
    blocked: false,
    blockedReason: '',
    startLocked: true,
    startMin: nextStart,
    startMax: nextStart,
    endMax: projectEnd,
  };
}
