import React from 'react';
import { AlertTriangle, Target } from 'lucide-react';

const SprintIndicatorCard = ({ embedded = false }) => {
  const nextSprint = {
    remaining: 15,
    points: 40,
    brokenPromises: 2,
    imbalance: 25,
  };

  const body = (
    <>
      {!embedded && (
        <h2 className="mb-6 flex items-center gap-3 text-lg font-black uppercase tracking-widest text-slate-900">
          <Target size={20} className="text-oracle-red" />
          Sprint Indicator
        </h2>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Al próximo Sprint</span>
          <span className="text-sm font-black text-slate-900">{nextSprint.remaining} ({nextSprint.points} pts)</span>
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Promesas Rotas</span>
          <span className="text-sm font-black text-red-600">{nextSprint.brokenPromises} feature</span>
        </div>
      </div>

      {/* Warning */}
      <div className="mt-6 flex items-center gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
        <AlertTriangle size={20} className="shrink-0 text-yellow-600" />
        <div>
          <p className="text-sm font-black text-yellow-800">Desbalance del {nextSprint.imbalance}%</p>
          <p className="mt-1 text-[10px] font-bold text-yellow-600">Se recomienda redistribuir la carga del próximo sprint.</p>
        </div>
      </div>
    </>
  );

  if (embedded) {
    return <div className="space-y-2">{body}</div>;
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
      {body}
    </div>
  );
};

export default SprintIndicatorCard;
