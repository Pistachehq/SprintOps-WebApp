import React, { useState } from 'react';
import { X } from 'lucide-react';

const JoinProjectModal = ({ isOpen, onClose, onJoin }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (!code || code.length !== 5) {
      setError('El código debe tener exactamente 5 dígitos');
      return;
    }

    if (!/^\d+$/.test(code)) {
      setError('El código solo debe contener números');
      return;
    }

    onJoin(code);
    setCode('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
          <h2 className="text-xl font-black text-gray-800 tracking-tight">Unirse a Proyecto</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              Código del Proyecto
            </label>
            <p className="text-sm text-gray-600 mb-4">
              Ingresa el código de 5 dígitos proporcionado por el Product Owner para unirte al proyecto.
            </p>
            <input 
              type="text"
              maxLength="5"
              pattern="\d*"
              required
              value={code}
              onChange={(e) => {
                const num = e.target.value.replace(/\D/g, '');
                setCode(num.slice(0, 5));
              }}
              className="w-full h-14 px-4 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#446E51] focus:border-transparent bg-gray-50 text-center text-2xl font-bold tracking-widest"
              placeholder="00000"
            />
            {error && (
              <p className="text-red-500 text-sm mt-2">{error}</p>
            )}
          </div>
          
          <div className="mt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 h-12 bg-gray-100 text-slate-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="flex-1 h-12 bg-[#446E51] text-white font-bold rounded-xl hover:bg-[#355640] transition-colors shadow-lg shadow-green-900/20"
            >
              Unirse
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinProjectModal;
