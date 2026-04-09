import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Smile, Frown, Lightbulb, Check } from 'lucide-react';
import { useAuth } from '../auth/hooks/useAuth';
import { useReflections } from './hooks/useReflections';

const RetrospectiveForm = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { addReflection } = useReflections(id);

  const [form, setForm] = useState({
    best: '',
    worst: '',
    improve: '',
  });
  const [showToast, setShowToast] = useState(false);

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSave = () => {
    addReflection({
      sprintId: id,
      userId: user?.id,
      wentWell: form.best,
      wentBad: form.worst,
      improvements: form.improve,
      type: 'retrospective'
    });

    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      setForm({ best: '', worst: '', improve: '' });
    }, 2500);
  };

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 relative">
      <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-3">
        <Lightbulb size={20} className="text-oracle-red" />
        Metodología — Scrum
      </h2>

      <div className="space-y-6">
        {/* Lo mejor */}
        <div>
          <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
            <Smile size={16} className="text-green-500" />
            Lo mejor del Sprint
          </label>
          <textarea
            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-oracle-red focus:bg-white outline-none transition-all resize-none"
            placeholder="¿Qué salió bien en este sprint?"
            rows="3"
            value={form.best}
            onChange={handleChange('best')}
          />
        </div>

        {/* Lo peor */}
        <div>
          <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
            <Frown size={16} className="text-red-500" />
            Lo peor del Sprint
          </label>
          <textarea
            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-oracle-red focus:bg-white outline-none transition-all resize-none"
            placeholder="¿Qué dificultades enfrentamos?"
            rows="3"
            value={form.worst}
            onChange={handleChange('worst')}
          />
        </div>

        {/* Cosas a mejorar */}
        <div>
          <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
            <Lightbulb size={16} className="text-yellow-500" />
            Cosas a mejorar
          </label>
          <textarea
            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-oracle-red focus:bg-white outline-none transition-all resize-none"
            placeholder="Acciones concretas para el próximo sprint..."
            rows="3"
            value={form.improve}
            onChange={handleChange('improve')}
          />
        </div>

        <button 
          onClick={handleSave}
          className="w-full py-3 bg-[#446E51] text-white rounded-xl font-black text-sm hover:opacity-90 transition-opacity shadow-lg shadow-green-100 flex items-center justify-center gap-2"
          disabled={showToast || !form.best || !form.worst || !form.improve}
        >
          {showToast ? <><Check size={18} /> Guardado</> : "Guardar Retrospectiva"}
        </button>
      </div>

      {/* Toast Notification */}
      <div className={`absolute top-4 right-4 bg-slate-900 text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl transition-all duration-300 z-[60] ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
          <Check size={14} className="text-white" />
        </div>
        <span className="font-bold text-sm">Retrospectiva guardada</span>
      </div>
    </div>
  );
};

export default RetrospectiveForm;
