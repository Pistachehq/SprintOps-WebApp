import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useAuth } from '../auth/hooks/useAuth';
import RetrospectiveForm from './RetrospectiveForm';
import HealthCheckCard, { getDefaultHealthValues, getOverallHealthStatus } from './HealthCheckCard';
import { useReflections } from './hooks/useReflections';

const ReflectionPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { addReflection } = useReflections(id);

  const [retro, setRetro] = useState({ best: '', worst: '', improve: '' });
  const [health, setHealth] = useState(getDefaultHealthValues);
  const [showToast, setShowToast] = useState(false);

  const onRetroChange = useCallback((field, value) => {
    setRetro((prev) => ({ ...prev, [field]: value }));
  }, []);

  const onHealthChange = useCallback((key, val) => {
    setHealth((prev) => ({ ...prev, [key]: val }));
  }, []);

  const canSubmit = retro.best.trim() && retro.worst.trim() && retro.improve.trim();

  const handleSaveAll = () => {
    if (!canSubmit || !id || showToast) return;
    const overall = getOverallHealthStatus(health);
    addReflection({
      sprintId: id,
      userId: user?.id,
      wentWell: retro.best.trim(),
      wentBad: retro.worst.trim(),
      improvements: retro.improve.trim(),
      type: 'retrospective',
      healthCheck: { ...health },
      overallHealthLabel: overall.label,
    });

    setShowToast(true);
    setRetro({ best: '', worst: '', improve: '' });
    setHealth(getDefaultHealthValues());
    setTimeout(() => setShowToast(false), 2800);
  };

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden font-sans">
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5 lg:items-stretch">
        <div className="flex min-h-0 flex-col lg:h-full lg:min-h-0">
          <RetrospectiveForm form={retro} onChange={onRetroChange} dense stretch />
        </div>
        <div className="flex min-h-0 flex-col lg:h-full lg:min-h-0">
          <HealthCheckCard values={health} onChange={onHealthChange} dense stretch />
        </div>
      </div>

      <div className="mt-3 shrink-0 pt-1 lg:mt-4">
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={!canSubmit || showToast}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#446E51] py-3.5 text-sm font-black text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {showToast ? (
            <>
              <Check size={18} /> Guardado
            </>
          ) : (
            'Guardar reflexión y health check'
          )}
        </button>
        <p className="mt-2 text-center text-xs text-slate-400">
          Se guardan juntos la retrospectiva del sprint y las valoraciones del health check.
        </p>
      </div>

      <div
        className={`pointer-events-none fixed right-6 top-24 z-[60] flex items-center gap-3 rounded-full bg-slate-900 px-6 py-3 text-white shadow-2xl transition-all duration-300 ${
          showToast ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
        }`}
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
          <Check size={14} className="text-white" />
        </div>
        <span className="text-sm font-bold">Reflexión y health check guardados</span>
      </div>
    </div>
  );
};

export default ReflectionPage;
