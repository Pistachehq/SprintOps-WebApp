import React from 'react';
import { Check, Copy } from 'lucide-react';
import { AnimatedPopup } from '../PopupPortal';

const ProjectCodeModal = ({ isOpen, projectName, projectCode, onClose }) => {
  const [copied, setCopied] = React.useState(false);
  const chars = String(projectCode || '').split('');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(projectCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <AnimatedPopup open={isOpen}>
      <div className="popup-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="popup-panel w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="bg-gradient-to-r from-[#67BFA1] to-[#3d7563] px-8 py-7 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
              <Check size={28} className="text-white" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">Proyecto creado</h2>
            <p className="mt-1 text-sm font-medium text-white/80">{projectName}</p>
          </div>

          <div className="flex flex-col gap-5 p-6">
            <div>
              <p className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-gray-500">
                Código para unirse
              </p>
              <div className="flex justify-center gap-2">
                {chars.map((char, index) => (
                  <span
                    key={`${char}-${index}`}
                    className="flex h-14 w-11 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 font-mono text-2xl font-black text-slate-800"
                  >
                    {char}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-center text-xs leading-relaxed text-gray-500">
                Compártelo con tu equipo. Las mayúsculas y las minúsculas importan.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-gray-100 font-bold text-slate-700 transition-colors hover:bg-gray-200"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? 'Copiado' : 'Copiar código'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-12 rounded-xl bg-[#67BFA1] font-bold text-white shadow-lg shadow-[#67BFA1]/25 transition-colors hover:bg-[#52A98A]"
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    </AnimatedPopup>
  );
};

export default ProjectCodeModal;
