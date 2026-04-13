import React from 'react';
import { Check, Copy } from 'lucide-react';

const ProjectCodeModal = ({ isOpen, projectName, projectCode, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(projectCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#446E51] to-[#2d4f39] p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Check size={32} className="text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">¡Proyecto Creado!</h2>
        </div>
        
        <div className="p-8 flex flex-col gap-6">
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Nombre del Proyecto</p>
            <p className="text-lg font-black text-gray-800">{projectName}</p>
          </div>

          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
              Código para unirse al equipo
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-4xl font-black text-[#446E51] tracking-widest text-center">
                  {projectCode}
                </p>
              </div>
              <button
                onClick={handleCopy}
                className="p-3 bg-[#446E51] text-white rounded-lg hover:bg-[#355640] transition-colors flex items-center justify-center"
                title="Copiar código"
              >
                {copied ? <Check size={20} /> : <Copy size={20} />}
              </button>
            </div>
            <p className="text-xs text-gray-600 text-center mt-3">
              Comparte este código con tu equipo para que puedan unirse al proyecto
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full h-12 bg-[#446E51] text-white font-bold rounded-xl hover:bg-[#355640] transition-colors shadow-lg shadow-green-900/20"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectCodeModal;
