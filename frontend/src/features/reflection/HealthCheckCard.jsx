import React from 'react';
import { Heart, Smile, Meh, Frown } from 'lucide-react';

export const HEALTH_METRIC_ITEMS = [
  { key: 'moral', label: 'Moral' },
  { key: 'clarity', label: 'Claridad' },
  { key: 'workload', label: 'Carga de Trabajo' },
  { key: 'communication', label: 'Comunicación' },
];

const defaultValues = HEALTH_METRIC_ITEMS.reduce((acc, item) => ({ ...acc, [item.key]: 3 }), {});

export const getDefaultHealthValues = () => ({ ...defaultValues });

export const getOverallHealthStatus = (values) => {
  const nums = HEALTH_METRIC_ITEMS.map((i) => values[i.key] ?? 2);
  const sum = nums.reduce((a, b) => a + b, 0);
  const avg = sum / nums.length;
  if (avg >= 2.5) return { label: 'Saludable', color: 'text-green-500' };
  if (avg >= 1.5) return { label: 'Estable', color: 'text-yellow-500' };
  return { label: 'En Riesgo', color: 'text-red-500' };
};

/**
 * @param {{ values: Record<string, number>, onChange: (key: string, val: number) => void }} props
 */
const HealthCheckCard = ({ values, onChange, dense = false, stretch = false }) => {
  const status = getOverallHealthStatus(values);
  const pad = dense ? 'p-5 sm:p-6' : 'p-8';
  const rowGap = dense ? 'space-y-2 sm:space-y-3' : 'space-y-6';
  const iconSz = dense ? 20 : 24;

  return (
    <div
      className={`rounded-2xl border border-gray-100 bg-white shadow-sm ${pad} ${
        stretch ? 'flex h-full min-h-0 flex-col lg:min-h-0' : ''
      }`}
    >
      <h2
        className={`flex shrink-0 items-center gap-2 text-base font-black uppercase tracking-widest text-slate-900 sm:gap-3 sm:text-lg ${
          dense ? 'mb-3 sm:mb-4' : 'mb-6'
        }`}
      >
        <Heart size={dense ? 18 : 20} className="shrink-0 text-oracle-red" />
        Health Check
      </h2>

      <div className={`${rowGap} ${stretch ? 'flex min-h-0 flex-1 flex-col' : ''}`}>
        {HEALTH_METRIC_ITEMS.map((item) => (
          <div
            key={item.key}
            className={`flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 ${dense ? 'px-2 py-2 sm:px-3 sm:py-2.5' : 'p-3'}`}
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 sm:text-xs">
              {item.label}
            </span>
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => onChange(item.key, 1)}
                className={`rounded-lg p-1.5 transition-all sm:rounded-xl sm:p-2 ${values[item.key] === 1 ? 'bg-red-100' : 'opacity-30 grayscale hover:bg-gray-200'}`}
              >
                <Frown size={iconSz} className="text-red-500" />
              </button>
              <button
                type="button"
                onClick={() => onChange(item.key, 2)}
                className={`rounded-lg p-1.5 transition-all sm:rounded-xl sm:p-2 ${values[item.key] === 2 ? 'bg-yellow-100' : 'opacity-30 grayscale hover:bg-gray-200'}`}
              >
                <Meh size={iconSz} className="text-yellow-500" />
              </button>
              <button
                type="button"
                onClick={() => onChange(item.key, 3)}
                className={`rounded-lg p-1.5 transition-all sm:rounded-xl sm:p-2 ${values[item.key] === 3 ? 'bg-green-100' : 'opacity-30 grayscale hover:bg-gray-200'}`}
              >
                <Smile size={iconSz} className="text-green-500" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div
        className={`rounded-xl border border-slate-100 bg-slate-50 shrink-0 ${dense ? 'p-3 sm:p-4' : 'p-4'} ${
          stretch || dense ? 'mt-3 sm:mt-4' : 'mt-6'
        }`}
      >
        <p className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-slate-400 sm:text-[10px]">Salud General del Equipo</p>
        <p className={`font-black ${dense ? 'text-xl sm:text-2xl' : 'text-2xl'} ${status.color}`}>{status.label}</p>
      </div>
    </div>
  );
};

export default HealthCheckCard;
