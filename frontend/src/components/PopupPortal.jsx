import { useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/** Igual que la duración de popup-overlay-out / popup-panel-out. */
const POPUP_EXIT_MS = 200;

/**
 * Pinta el popup fuera del contenido (tabs con transform, overflow).
 * Así el oscurecido cubre toda la app y no se recorta en las tarjetas.
 */
export default function PopupPortal({ children }) {
  const [root, setRoot] = useState(null);

  useLayoutEffect(() => {
    setRoot(document.getElementById('popup-root'));
  }, []);

  if (!root) return null;
  return createPortal(children, root);
}

/** Mantiene el popup montado al cerrar para que corra la animación de salida. */
export function AnimatedPopup({ open, children }) {
  const [mounted, setMounted] = useState(open);
  const [leaving, setLeaving] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setMounted(true);
      setLeaving(false);
    } else {
      setLeaving(true);
    }
  }

  useEffect(() => {
    if (open || !leaving) return undefined;
    const timer = window.setTimeout(() => setMounted(false), POPUP_EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [open, leaving]);

  if (!mounted) return null;

  return (
    <PopupPortal>
      <div className={leaving ? 'popup-leave' : undefined}>{children}</div>
    </PopupPortal>
  );
}
