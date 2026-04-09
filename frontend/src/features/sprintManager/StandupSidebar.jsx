import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';

const StandupSidebar = ({ isOpen, onClose }) => {
  const [transitionOpen, setTransitionOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [standupData, setStandupData] = useLocalStorage('sprintops_standup', {
    done: '',
    doing: '',
    blockers: ''
  });

  const [formData, setFormData] = useState(standupData);

  useEffect(() => {
    if (isOpen) {
      setFormData(standupData);
      const timer = setTimeout(() => setTransitionOpen(true), 10);
      return () => clearTimeout(timer);
    } else {
      setTransitionOpen(false);
    }
  }, [isOpen, standupData]);

  const handleSave = (e) => {
    e.preventDefault();
    setStandupData(formData);
    
    // Show toast
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      onClose();
    }, 2000);
  };

  if (!isOpen && !transitionOpen) return null;

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/20 z-40 transition-opacity duration-300 ${
          transitionOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      <div 
        className={`fixed inset-y-0 right-0 w-[400px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out p-10 flex flex-col ${
          transitionOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">Daily Meeting</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 space-y-8 relative">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500 uppercase tracking-widest">¿Qué hice?</label>
            <textarea 
              className="w-full h-32 p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#446E51] focus:bg-white transition-all text-gray-700 resize-none"
              placeholder="Describe tus logros de ayer..."
              value={formData.done}
              onChange={(e) => setFormData({...formData, done: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500 uppercase tracking-widest">¿Qué haré?</label>
            <textarea 
              className="w-full h-32 p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#446E51] focus:bg-white transition-all text-gray-700 resize-none"
              placeholder="¿Cuáles son tus objetivos para hoy?"
              value={formData.doing}
              onChange={(e) => setFormData({...formData, doing: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500 uppercase tracking-widest text-red-500">¿Qué impedimentos tengo?</label>
            <textarea 
              className="w-full h-32 p-4 bg-red-50/30 border border-red-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-400 focus:bg-white transition-all text-gray-700 resize-none"
              placeholder="¿Hay algo que te bloquee?"
              value={formData.blockers}
              onChange={(e) => setFormData({...formData, blockers: e.target.value})}
            />
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-[#446E51] text-white rounded-2xl font-black text-lg hover:opacity-90 transition-opacity shadow-lg shadow-green-100 mt-auto flex items-center justify-center gap-2"
            disabled={showToast}
          >
            {showToast ? <><Check size={20} /> Guardado</> : "Guardar Daily Meeting"}
          </button>
        </form>

        {/* Toast Notification */}
        <div className={`absolute top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl transition-all duration-300 z-[60] ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <Check size={14} className="text-white" />
          </div>
          <span className="font-bold text-sm">Daily Meeting guardado correctamente</span>
        </div>
      </div>
    </>
  );
};

export default StandupSidebar;
