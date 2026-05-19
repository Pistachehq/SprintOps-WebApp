import { useEffect } from 'react';

const REVEAL_MS = 900;

/**
 * Muestra brevemente las barras de scroll del elemento que se está desplazando
 * (clase global `scrollbar-reveal`), usando captura en document.
 */
export function useScrollbarRevealOnScroll() {
  useEffect(() => {
    const timers = new Map();

    const clearTimer = (el) => {
      const id = timers.get(el);
      if (id != null) {
        clearTimeout(id);
        timers.delete(el);
      }
    };

    const onScrollCapture = (e) => {
      const raw = e.target;
      const el =
        raw === document
          ? document.documentElement
          : raw instanceof HTMLElement
            ? raw
            : null;
      if (!el) return;

      const canScroll =
        el.scrollHeight > el.clientHeight + 1 ||
        el.scrollWidth > el.clientWidth + 1;
      if (!canScroll) return;

      el.classList.add('scrollbar-reveal');
      clearTimer(el);
      const id = setTimeout(() => {
        if (el.isConnected) el.classList.remove('scrollbar-reveal');
        timers.delete(el);
      }, REVEAL_MS);
      timers.set(el, id);
    };

    document.addEventListener('scroll', onScrollCapture, { capture: true, passive: true });
    return () => {
      document.removeEventListener('scroll', onScrollCapture, { capture: true });
      for (const t of timers.values()) clearTimeout(t);
      timers.clear();
    };
  }, []);
}
