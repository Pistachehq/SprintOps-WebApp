import React, { useState } from 'react';
import { X } from 'lucide-react';
import ProjectCodeModal from '../../components/ui/ProjectCodeModal';

const CreateProjectModal = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');

  if (!isOpen) return null;

  const generateProjectCode = () => {
    return String(Math.floor(Math.random() * 90000) + 10000).slice(0, 5);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const result = await onCreate({
      name,
      description,
      start,
      end,
    });
    
    setGeneratedCode(result?.codigo || '');
    setShowCodeModal(true);
    setName('');
    setDescription('');
    setStart('');
    setEnd('');
  };

  const handleCodeModalClose = () => {
    setShowCodeModal(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
            <h2 className="text-xl font-black text-gray-800 tracking-tight">Crear Nuevo Proyecto</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={24} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Nombre del Proyecto</label>
              <input 
                required
                className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#446E51] bg-gray-50"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej. Reestructuración de API"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Descripción</label>
              <textarea 
                required
                className="w-full p-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#446E51] bg-gray-50 resize-none h-24"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Breve descripción del proyecto..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Fecha Inicio</label>
                <input 
                  required type="date"
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#446E51] bg-gray-50 text-sm"
                  value={start} onChange={e => setStart(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Fecha Fin</label>
                <input 
                  required type="date"
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#446E51] bg-gray-50 text-sm"
                  value={end} onChange={e => setEnd(e.target.value)}
                />
              </div>
            </div>
            
            <div className="mt-4 flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 h-12 bg-gray-100 text-slate-600 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                Cancelar
              </button>
              <button type="submit" className="flex-1 h-12 bg-[#446E51] text-white font-bold rounded-xl hover:bg-[#355640] transition-colors shadow-lg shadow-green-900/20">
                Crear Proyecto
              </button>
            </div>
          </form>
        </div>
      </div>

      <ProjectCodeModal 
        isOpen={showCodeModal}
        projectName={name}
        projectCode={generatedCode}
        onClose={handleCodeModalClose}
      />
    </>
  );
};

export default CreateProjectModal;
