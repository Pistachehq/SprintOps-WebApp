import React, { useEffect, useRef, useState } from 'react';

const PAGE = '#F0EFED';

function withAlpha(hex, alpha) {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function veil(color, direction) {
  const solid = withAlpha(color, 1);
  const mid = withAlpha(color, 0.55);
  const soft = withAlpha(color, 0.18);
  const clear = withAlpha(color, 0);
  const angle = direction === 'bottom' ? 'to top' : 'to bottom';
  return `linear-gradient(${angle}, ${solid} 0%, ${solid} 10%, ${mid} 38%, ${soft} 68%, ${clear} 100%)`;
}

/**
 * Scroll vertical. Si queda contenido fuera del borde, se desvanece
 * hacia el fondo en lugar de cortarse de golpe.
 */
const EdgeSuckScroll = ({ className = '', fade = PAGE, children }) => {
  const ref = useRef(null);
  const [edges, setEdges] = useState({ up: false, down: false });

  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const up = root.scrollTop > 8;
        const down = root.scrollHeight - root.scrollTop - root.clientHeight > 8;
        setEdges((prev) => (prev.up === up && prev.down === down ? prev : { up, down }));
      });
    };
    const ro = new ResizeObserver(schedule);
    const observe = () => {
      ro.disconnect();
      ro.observe(root);
      for (const child of root.children) ro.observe(child);
    };
    const mo = new MutationObserver(() => {
      observe();
      schedule();
    });
    root.addEventListener('scroll', schedule, { passive: true });
    mo.observe(root, { childList: true });
    observe();
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      root.removeEventListener('scroll', schedule);
      ro.disconnect();
      mo.disconnect();
    };
  }, []);

  return (
    <div className="relative min-h-0 w-full flex-1">
      <div
        ref={ref}
        className={`absolute inset-0 overflow-y-auto ${className}`}
        style={{ scrollbarWidth: 'thin' }}
      >
        {children}
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-16 transition-opacity duration-200"
        style={{ opacity: edges.up ? 1 : 0, background: veil(fade, 'top') }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-20 transition-opacity duration-200"
        style={{ opacity: edges.down ? 1 : 0, background: veil(fade, 'bottom') }}
      />
    </div>
  );
};

export default EdgeSuckScroll;
