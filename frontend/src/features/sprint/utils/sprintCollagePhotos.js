import { timelineRepository } from '../../../data/repositories/timelineRepository';

/**
 * Imágenes de respaldo (Unsplash — licencia: https://unsplash.com/license).
 * Uso como relleno cuando no hay suficientes fotos del daily en el cronograma.
 */
export const FALLBACK_COLLAGE_IMAGES = [
  'https://images.unsplash.com/photo-1512314889357-e157c22f938d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=400&q=80',
];

const COLLAGE_SLOT_COUNT = 4;

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithRng(array, rng) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Filtra fechas ISO yyyy-MM-dd a la vigencia del sprint (inclusive).
 */
export function filterPhotoDatesInSprintRange(photoDates, startDate, endDate) {
  const dates = (photoDates || []).filter(Boolean);
  if (!startDate && !endDate) return dates;

  let from = startDate || null;
  let to = endDate || null;
  if (from && to && to < from) {
    const t = from;
    from = to;
    to = t;
  }

  return dates.filter((d) => {
    if (from && to) return d >= from && d <= to;
    if (from) return d >= from;
    if (to) return d <= to;
    return true;
  });
}

/**
 * Construye exactamente 4 URLs: primero fotos del cronograma (orden pseudoaleatorio por sprint),
 * el resto con imágenes libres de derechos.
 */
export function buildSprintCollageUrls(projectId, sprint, photoDatesInRange) {
  const sid = Number(sprint?.id) || 0;
  const pid = projectId != null && projectId !== '' ? Number(projectId) : 0;

  if (!pid) {
    const rng = mulberry32(sid * 7919 + 1);
    return Array.from({ length: COLLAGE_SLOT_COUNT }, (_, i) => {
      const fi =
        (sid * 3 + i * 7 + Math.floor(rng() * FALLBACK_COLLAGE_IMAGES.length)) %
        FALLBACK_COLLAGE_IMAGES.length;
      return FALLBACK_COLLAGE_IMAGES[fi];
    });
  }

  const seed = sid * 7919 + pid * 617 + (photoDatesInRange?.length || 0) * 13 + 1;
  const rng = mulberry32(seed);
  const shuffled = shuffleWithRng([...(photoDatesInRange || [])], rng);
  const picked = shuffled.slice(0, COLLAGE_SLOT_COUNT);

  const urls = [];
  for (let i = 0; i < COLLAGE_SLOT_COUNT; i++) {
    if (i < picked.length) {
      const base = timelineRepository.getPhotoUrl(pid, picked[i]);
      urls.push(`${base}?v=${sid}-${i}`);
    } else {
      const fi =
        (sid * 3 + i * 7 + Math.floor(rng() * FALLBACK_COLLAGE_IMAGES.length)) %
        FALLBACK_COLLAGE_IMAGES.length;
      urls.push(FALLBACK_COLLAGE_IMAGES[fi]);
    }
  }
  return urls;
}

export { COLLAGE_SLOT_COUNT };
