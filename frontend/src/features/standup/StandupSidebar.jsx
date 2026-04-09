import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { X, Save, Send } from 'lucide-react';
import { useAuth } from '../auth/hooks/useAuth';
import { useStandups } from './hooks/useStandups';

const StandupSidebar = ({ isOpen, onClose }) => {
  const { id } = useParams();
  const { user } = useAuth();
  const { addStandup } = useStandups(id);

  const [yesterday, setYesterday] = useState('');
  const [today, setToday] = useState('');
  const [blockers, setBlockers] = useState('');

  const handleSubmit = () => {
    addStandup({
      sprintId: id,
      userId: user?.id,
      date: new Date().toISOString().split('T')[0],
      yesterday,
      today,
      blockers
    });
    setYesterday('');
    setToday('');
    setBlockers('');
    onClose();
  };

  return (
    <div 
      className={`fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-gray-100 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="h-full flex flex-col">
        <div className="p-6 border-b flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <h2 className="font-bold">Daily Standup</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">¿Qué hice ayer?</label>
            <textarea 
              value={yesterday}
              onChange={(e) => setYesterday(e.target.value)}
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-oracle-red focus:bg-white outline-none transition-all"
              placeholder="Describa sus logros..."
              rows="4"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">¿Qué haré hoy?</label>
            <textarea 
              value={today}
              onChange={(e) => setToday(e.target.value)}
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-oracle-red focus:bg-white outline-none transition-all"
              placeholder="Su plan para hoy..."
              rows="4"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">¿Algún impedimento?</label>
            <textarea 
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              className="w-full p-4 bg-gray-50 border border-red-50 rounded-xl text-sm focus:ring-2 focus:ring-oracle-red focus:bg-white outline-none transition-all"
              placeholder="Bloqueos o riesgos..."
              rows="4"
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-100">
          <button 
            onClick={handleSubmit}
            disabled={!yesterday || !today}
            className="w-full flex items-center justify-center gap-2 py-4 btn-primary shadow-lg shadow-red-100 disabled:opacity-50"
          >
            <Send size={18} /> Guardar Reporte
          </button>
        </div>
      </div>
    </div>
  );
};

export default StandupSidebar;
