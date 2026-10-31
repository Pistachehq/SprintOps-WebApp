import React, { useLayoutEffect, useState } from 'react';

/** Zoom del navegador al cargar. A partir de ahí el formato no se reacomoda. */
let baselineDpr = 0;

function readViewport() {
  const viewport = window.visualViewport;
  return {
    width: viewport?.width ?? window.innerWidth,
    height: viewport?.height ?? window.innerHeight,
    dpr: window.devicePixelRatio || 1,
  };
}

function measureFrame() {
  const { width, height, dpr } = readViewport();
  if (!baselineDpr) baselineDpr = dpr;
  const zoom = dpr / baselineDpr;
  const safeZoom = Number.isFinite(zoom) && zoom > 0 ? zoom : 1;
  return {
    width: Math.max(width * safeZoom, 1),
    height: Math.max(height * safeZoom, 1),
    scale: 1 / safeZoom,
  };
}

/**
 * Al 100% de zoom la app ocupa la ventana en su tamaño real.
 * Si el zoom cambia, el mismo formato se encoge o crece entero para seguir cabiendo,
 * sin hueco abajo ni recortes.
 */
const AppFrame = ({ children }) => {
  const [frame, setFrame] = useState(measureFrame);

  useLayoutEffect(() => {
    const fit = () => {
      const next = measureFrame();
      setFrame(next);
      const root = document.documentElement;
      root.style.setProperty('--app-w', `${next.width}px`);
      root.style.setProperty('--app-h', `${next.height}px`);
    };

    fit();
    window.addEventListener('resize', fit);
    window.visualViewport?.addEventListener('resize', fit);
    return () => {
      window.removeEventListener('resize', fit);
      window.visualViewport?.removeEventListener('resize', fit);
    };
  }, []);

  return (
    <div className="app-viewport">
      <div
        className="app-stage"
        style={{
          width: frame.width,
          height: frame.height,
          transform: `scale(${frame.scale})`,
        }}
      >
        <div className="h-full w-full overflow-hidden">{children}</div>
      </div>
    </div>
  );
};

export default AppFrame;
