import React from 'react';
import { Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const VelocityChart = ({ embedded = false }) => {
  const velocity = [
    { name: 'Sprint 1', planned: 40, completed: 35 },
    { name: 'Sprint 2', planned: 45, completed: 45 },
    { name: 'Sprint 3', planned: 50, completed: 42 },
    { name: 'Sprint 4', planned: 42, completed: 40 },
    { name: 'Sprint 5(Actual)', planned: 55, completed: 20 },
  ];
  
  // Calculate average of completed points
  const avg = (velocity.reduce((sum, sprint) => sum + sprint.completed, 0) / velocity.length).toFixed(1);

  const body = (
    <>
      {!embedded && (
        <h2 className="mb-6 flex items-center gap-3 text-lg font-black uppercase tracking-widest text-slate-900">
          <Activity size={20} className="text-oracle-red" />
          Velocidad Histórica
        </h2>
      )}

      <div className={`w-full ${embedded ? 'mb-3 h-44' : 'mb-4 h-48'}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={velocity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Bar dataKey="planned" name="Planeados" fill="#E2E8F0" radius={[4, 4, 0, 0]} barSize={20} />
            <Bar dataKey="completed" name="Completados" fill="#67BFA1" radius={[4, 4, 0, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={`grid grid-cols-2 gap-4 ${embedded ? 'mt-4' : 'mt-6'}`}>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Promedio</p>
          <p className="text-xl font-black text-slate-900">{avg} pts</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Tendencia</p>
          <p className="text-xl font-black text-green-600">Estable ↗</p>
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

export default VelocityChart;
