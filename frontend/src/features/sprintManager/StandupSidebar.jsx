import React, { useState, useEffect } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
import apiClient from '../../data/api/apiClient';

const StandupSidebar = ({ isOpen, onClose, sprintId, userId }) => {
  const [transitionOpen, setTransitionOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [reunionId, setReunionId] = useState(null);
  const [todayDate, setTodayDate] = useState('');
  const [formData, setFormData] = useState({ done: '', doing: '', blockers: '' });

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setTransitionOpen(true), 10);
      loadDailyData();
      return () => clearTimeout(timer);
    } else {
      setTransitionOpen(false);
    }
  }, [isOpen]);

  const loadDailyData = async () => {
    if (!sprintId || !userId) return;
    setIsLoading(true);
    try {
      const data = await apiClient.post('/reuniones/daily', { sprintId: Number(sprintId), userId: Number(userId) });
      setReunionId(data.reunionId);
      setTodayDate(data.date);
      setFormData({
        done: data.done || '',
        doing: data.doing || '',
        blockers: data.blockers || '',
      });
    } catch (err) {
      console.error('Error loading daily meeting:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!reunionId || !userId) return;
    setIsSaving(true);
    try {
      await apiClient.post('/reuniones/daily/save', {
        reunionId,
        userId: Number(userId),
        done: formData.done,
        doing: formData.doing,
        blockers: formData.blockers,
      });
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error saving daily meeting:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
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
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">Daily Meeting</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        {todayDate && (
          <p className="text-xs font-medium text-gray-400 mb-8 capitalize">{formatDate(todayDate)}</p>
        )}

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 size={32} className="text-[#67BFA1] animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-400 font-medium">Cargando...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="flex-1 space-y-8 relative">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500 uppercase tracking-widest">¿Qué hice?</label>
              <textarea 
                className="w-full h-32 p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#67BFA1] focus:bg-white transition-all text-gray-700 resize-none"
                placeholder="Describe tus logros de ayer..."
                value={formData.done}
                onChange={(e) => setFormData({...formData, done: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500 uppercase tracking-widest">¿Qué haré?</label>
              <textarea 
                className="w-full h-32 p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#67BFA1] focus:bg-white transition-all text-gray-700 resize-none"
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
              className="w-full py-4 bg-[#67BFA1] text-white rounded-2xl font-black text-lg hover:opacity-90 transition-opacity shadow-lg shadow-oracle-main/20 mt-auto flex items-center justify-center gap-2"
              disabled={showToast || isSaving}
            >
              {showToast ? (
                <><Check size={20} /> Guardado</>
              ) : isSaving ? (
                <><Loader2 size={20} className="animate-spin" /> Guardando...</>
              ) : (
                "Guardar Daily Meeting"
              )}
            </button>
          </form>
        )}

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
