/** Misma paleta que el cronograma (Gantt); el backend solo acepta estos hex en minúsculas. */
export const ISSUE_TAG_COLORS = [
  '#446e51',
  '#e8702a',
  '#3b82f6',
  '#a855f7',
  '#14b8a6',
  '#f59e0b',
  '#ec4899',
  '#8b5cf6',
  '#ef4444',
  '#06b6d4',
  '#d97706',
  '#10b981',
];

export const DEFAULT_ISSUE_TAG_COLOR = ISSUE_TAG_COLORS[0];

export function normalizeIssueTagColor(hex) {
  if (hex == null || typeof hex !== 'string') return '';
  return hex.trim().toLowerCase();
}

export function isAllowedIssueTagColor(hex) {
  const n = normalizeIssueTagColor(hex);
  return n !== '' && ISSUE_TAG_COLORS.includes(n);
}
