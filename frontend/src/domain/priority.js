/** Valores que se guardan. Las etiquetas visibles son siempre Bajo, Medio y Alto. */
export const PRIORITY_LEVELS = [
  { value: 'high', label: 'Alto' },
  { value: 'medium', label: 'Medio' },
  { value: 'low', label: 'Bajo' },
];

const STYLES = {
  high: 'bg-[#EF4444] text-white',
  medium: 'bg-[#F5B400] text-white',
  low: 'bg-[#22C55E] text-white',
};

export function normalizePriority(value) {
  const v = String(value || '').trim().toLowerCase();
  if (['high', 'alta', 'alto', 'critica', 'crítica', 'critical', 'critico', 'crítico'].includes(v)) return 'high';
  if (['low', 'baja', 'bajo'].includes(v)) return 'low';
  return 'medium';
}

export function priorityLabel(value) {
  const key = normalizePriority(value);
  return PRIORITY_LEVELS.find((level) => level.value === key).label;
}

export function priorityClass(value) {
  return STYLES[normalizePriority(value)];
}
