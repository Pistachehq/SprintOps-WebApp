import React from 'react';
import { Users } from 'lucide-react';

const StandupParticipationCard = () => {
  const standup = {
    'Axel (Dev)': '8/10',
    'Juan (Dev)': '10/10',
    'Maria (PO)': '5/10'
  };
  const teamAvgHours = '4.5';

  const getColor = (participation) => {
    const [done, total] = participation.split('/').map(Number);
    const pct = done / total;
    if (pct >= 0.8) return 'text-green-600 bg-green-50';
    if (pct >= 0.5) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
      <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-3">
        <Users size={20} className="text-oracle-red" />
        Participación Standup
      </h2>

      <div className="space-y-3">
        {Object.entries(standup).map(([name, participation]) => (
          <div
            key={name}
            className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#446E51] flex items-center justify-center text-white text-sm font-black">
                {name.charAt(0)}
              </div>
              <span className="text-sm font-bold text-slate-900">{name}</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-black ${getColor(participation)}`}>
              {participation}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
          Equipo
        </p>
        <p className="text-xl font-black text-slate-900">{teamAvgHours} horas promedio</p>
      </div>
    </div>
  );
};

export default StandupParticipationCard;
