const STORAGE_KEY = 'sprintops.appearance.v1';

export const DEFAULT_COLORS = {
  accent: '#67BFA1',
  bg: '#F0EFED',
  surface: '#FFFFFF',
  text: '#1e293b',
  muted: '#64748b',
  header: '#2B2B2B',
};

export const DARK_COLORS = {
  accent: '#7dceb4',
  bg: '#121614',
  surface: '#1c2420',
  text: '#f4f7f5',
  muted: '#a3b0aa',
  header: '#0c100e',
};

export const CONTRAST_COLORS = {
  accent: '#ffe14a',
  bg: '#000000',
  surface: '#0d0d0d',
  text: '#ffffff',
  muted: '#f2f2f2',
  header: '#000000',
};

export const FONTS = [
  { id: 'system', label: 'Pistache', stack: 'ui-sans-serif, system-ui, "Segoe UI", sans-serif' },
  { id: 'segoe', label: 'Segoe UI', stack: '"Segoe UI", sans-serif' },
  { id: 'verdana', label: 'Verdana', stack: 'Verdana, Geneva, sans-serif' },
  { id: 'georgia', label: 'Georgia', stack: 'Georgia, "Times New Roman", serif' },
  { id: 'palatino', label: 'Palatino', stack: '"Palatino Linotype", Palatino, "Book Antiqua", serif' },
  { id: 'consolas', label: 'Consolas', stack: 'Consolas, "Cascadia Mono", ui-monospace, monospace' },
];

export const FONT_SIZES = [
  { id: 'sm', label: 'Pequeña', value: '14px' },
  { id: 'md', label: 'Normal', value: '16px' },
  { id: 'lg', label: 'Grande', value: '17.5px' },
  { id: 'xl', label: 'Muy grande', value: '19px' },
];

export const LINE_HEIGHTS = [
  { id: 'tight', label: 'Compacto', value: '1.35' },
  { id: 'normal', label: 'Normal', value: '1.5' },
  { id: 'relaxed', label: 'Amplio', value: '1.75' },
];

export const THEMES = [
  { id: 'default', label: 'Predeterminado', hint: 'El verde pistache de siempre' },
  { id: 'dark', label: 'Oscuro', hint: 'Fondos oscuros y texto claro' },
  { id: 'contrast', label: 'Alto contraste', hint: 'Negro, blanco y acento fuerte' },
  { id: 'custom', label: 'Personalizado', hint: 'Arma tu propia paleta' },
];

const COLOR_KEYS = ['accent', 'bg', 'surface', 'text', 'muted', 'header'];

export function defaultAppearance() {
  return {
    mode: 'default',
    presetId: null,
    custom: { ...DEFAULT_COLORS },
    presets: [],
    font: 'system',
    fontSize: 'md',
    lineHeight: 'normal',
  };
}

function isHex(value) {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);
}

function sanitizeColors(input, fallback) {
  const next = { ...fallback };
  if (!input || typeof input !== 'object') return next;
  for (const key of COLOR_KEYS) {
    if (isHex(input[key])) next[key] = input[key];
  }
  return next;
}

export function loadAppearance() {
  const base = defaultAppearance();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw);
    const mode = ['default', 'dark', 'contrast', 'custom', 'preset'].includes(parsed.mode)
      ? parsed.mode
      : 'default';
    const presets = Array.isArray(parsed.presets)
      ? parsed.presets
          .filter((item) => item && typeof item.name === 'string' && item.name.trim())
          .map((item) => ({
            id: String(item.id || `preset-${item.name}`),
            name: item.name.trim().slice(0, 40),
            colors: sanitizeColors(item.colors, DEFAULT_COLORS),
          }))
      : [];
    const presetId = presets.some((item) => item.id === parsed.presetId) ? parsed.presetId : null;
    return {
      mode: mode === 'preset' && !presetId ? 'default' : mode,
      presetId,
      custom: sanitizeColors(parsed.custom, DEFAULT_COLORS),
      presets,
      font: FONTS.some((item) => item.id === parsed.font) ? parsed.font : 'system',
      fontSize: FONT_SIZES.some((item) => item.id === parsed.fontSize) ? parsed.fontSize : 'md',
      lineHeight: LINE_HEIGHTS.some((item) => item.id === parsed.lineHeight) ? parsed.lineHeight : 'normal',
    };
  } catch {
    return base;
  }
}

export function saveAppearance(prefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  applyAppearance(prefs);
  return prefs;
}

function channel(hex, index) {
  return parseInt(hex.slice(1 + index, 3 + index), 16);
}

function luminance(hex) {
  const parts = [0, 2, 4].map((index) => {
    const value = channel(hex, index) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * parts[0] + 0.7152 * parts[1] + 0.0722 * parts[2];
}

export function inkFor(hex) {
  return luminance(hex) > 0.58 ? '#14201b' : '#ffffff';
}

export function darken(hex, amount = 0.14) {
  const parts = [0, 2, 4].map((index) => Math.max(0, Math.min(255, Math.round(channel(hex, index) * (1 - amount)))));
  return `#${parts.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

export function colorsFor(prefs) {
  if (prefs.mode === 'dark') return DARK_COLORS;
  if (prefs.mode === 'contrast') return CONTRAST_COLORS;
  if (prefs.mode === 'custom') return prefs.custom;
  if (prefs.mode === 'preset') {
    return prefs.presets.find((item) => item.id === prefs.presetId)?.colors || DEFAULT_COLORS;
  }
  return DEFAULT_COLORS;
}

export function applyAppearance(prefs) {
  const root = document.documentElement;
  const colors = colorsFor(prefs);
  const themed = prefs.mode !== 'default';
  const font = FONTS.find((item) => item.id === prefs.font) || FONTS[0];
  const size = FONT_SIZES.find((item) => item.id === prefs.fontSize) || FONT_SIZES[1];
  const line = LINE_HEIGHTS.find((item) => item.id === prefs.lineHeight) || LINE_HEIGHTS[1];
  const border = prefs.mode === 'contrast'
    ? colors.text
    : `color-mix(in srgb, ${colors.text} 18%, ${colors.surface})`;

  root.dataset.theme = themed ? 'themed' : 'default';
  root.style.fontSize = size.value;
  root.style.setProperty('--app-accent', colors.accent);
  root.style.setProperty('--app-accent-hover', darken(colors.accent));
  root.style.setProperty('--app-on-accent', inkFor(colors.accent));
  root.style.setProperty('--app-bg', colors.bg);
  root.style.setProperty('--app-surface', colors.surface);
  root.style.setProperty('--app-text', colors.text);
  root.style.setProperty('--app-muted', colors.muted);
  root.style.setProperty('--app-header', colors.header);
  root.style.setProperty('--app-header-text', inkFor(colors.header));
  root.style.setProperty('--app-border', themed ? border : '#e5e7eb');
  root.style.setProperty('--app-font', font.stack);
  root.style.setProperty('--app-line', line.value);
}

export function applyStoredAppearance() {
  applyAppearance(loadAppearance());
}
