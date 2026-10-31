import { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';

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
