import React from 'react';
import { AlertTriangle, Target } from 'lucide-react';

const SprintIndicatorCard = () => {
  const nextSprint = {
    remaining: 15,
    points: 40,
    brokenPromises: 2,
    imbalance: 25,
  };

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
      <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-3">
        <Target size={20} className="text-oracle-red" />
        Sprint Indicator
      </h2>

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
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center gap-3">
        <AlertTriangle size={20} className="text-yellow-600 shrink-0" />
        <div>
          <p className="text-sm font-black text-yellow-800">Desbalance del {nextSprint.imbalance}%</p>
          <p className="text-[10px] font-bold text-yellow-600 mt-1">Se recomienda redistribuir la carga del próximo sprint.</p>
        </div>
      </div>
    </div>
  );
};

export default SprintIndicatorCard;
