import React from 'react';
import { Smile, Frown, Lightbulb } from 'lucide-react';

/**
 * @param {{
 *   form: { best: string, worst: string, improve: string },
 *   onChange: (field: 'best'|'worst'|'improve', value: string) => void
 * }} props
 */
const RetrospectiveForm = ({ form, onChange, dense = false, stretch = false }) => {
  const handleChange = (field) => (e) => onChange(field, e.target.value);
  const rows = dense ? 2 : 3;
  const pad = dense ? 'p-5 sm:p-6' : 'p-8';
  const gap = dense ? 'space-y-3 sm:space-y-4' : 'space-y-6';
  const fieldWrap = stretch ? 'flex min-h-0 flex-1 flex-col' : '';
  const taBase =
    'w-full resize-none rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm outline-none transition-all focus:bg-white focus:ring-2 focus:ring-oracle-red sm:p-4';
  const taStretch = stretch ? ' min-h-[4.5rem] flex-1 lg:min-h-0' : '';

  return (
    <div
      className={`relative rounded-2xl border border-gray-100 bg-white shadow-sm ${pad} ${
        stretch ? 'flex h-full min-h-0 flex-col lg:min-h-0' : ''
      }`}
    >
      <h2
        className={`flex shrink-0 items-center gap-2 text-base font-black uppercase tracking-widest text-slate-900 sm:gap-3 sm:text-lg ${
          dense ? 'mb-3 sm:mb-4' : 'mb-6'
        }`}
      >
        <Lightbulb size={dense ? 18 : 20} className="shrink-0 text-oracle-red" />
        Reflexión del Sprint
      </h2>

      <div className={`${gap} ${stretch ? 'flex min-h-0 flex-1 flex-col' : ''}`}>
        <div className={fieldWrap}>
          <label className="mb-1.5 flex shrink-0 items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400 sm:mb-2 sm:text-xs">
            <Smile size={14} className="text-green-500 sm:h-4 sm:w-4" />
            Lo mejor del Sprint
          </label>
          <textarea
            className={`${taBase}${taStretch}`}
            placeholder="¿Qué salió bien en este sprint?"
            rows={stretch ? undefined : rows}
            value={form.best}
            onChange={handleChange('best')}
          />
        </div>

        <div className={fieldWrap}>
          <label className="mb-1.5 flex shrink-0 items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400 sm:mb-2 sm:text-xs">
            <Frown size={14} className="text-red-500 sm:h-4 sm:w-4" />
            Lo peor del Sprint
          </label>
          <textarea
            className={`${taBase}${taStretch}`}
            placeholder="¿Qué dificultades enfrentamos?"
            rows={stretch ? undefined : rows}
            value={form.worst}
            onChange={handleChange('worst')}
          />
        </div>

        <div className={fieldWrap}>
          <label className="mb-1.5 flex shrink-0 items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400 sm:mb-2 sm:text-xs">
            <Lightbulb size={14} className="text-yellow-500 sm:h-4 sm:w-4" />
            Cosas a mejorar
          </label>
          <textarea
            className={`${taBase}${taStretch}`}
            placeholder="Acciones concretas para el próximo sprint..."
            rows={stretch ? undefined : rows}
            value={form.improve}
            onChange={handleChange('improve')}
          />
        </div>
      </div>
    </div>
  );
};

export default RetrospectiveForm;
