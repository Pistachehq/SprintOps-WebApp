import React, { useState } from 'react';
import { Heart, Smile, Meh, Frown } from 'lucide-react';

const metricItems = [
  { key: 'moral', label: 'Moral' },
  { key: 'clarity', label: 'Claridad' },
  { key: 'workload', label: 'Carga de Trabajo' },
  { key: 'communication', label: 'Comunicación' },
];

const HealthCheckCard = () => {
  // Store the state as 1 (Frown), 2 (Meh), 3 (Smile)
  const [values, setValues] = useState(
    metricItems.reduce((acc, item) => ({ ...acc, [item.key]: 3 }), {})
  );

  const handleChange = (key, val) => {
    setValues({ ...values, [key]: val });
  };

  const getOverallStatus = () => {
    const sum = Object.values(values).reduce((a, b) => a + b, 0);
    const avg = sum / Object.values(values).length;
    if (avg >= 2.5) return { label: 'Saludable', color: 'text-green-500' };
    if (avg >= 1.5) return { label: 'Estable', color: 'text-yellow-500' };
    return { label: 'En Riesgo', color: 'text-red-500' };
  };

  const status = getOverallStatus();

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
      <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-3">
        <Heart size={20} className="text-oracle-red" />
        Health Check
      </h2>

      <div className="space-y-6">
        {metricItems.map((item) => (
          <div key={item.key} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-xs font-black text-slate-600 uppercase tracking-widest">
              {item.label}
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleChange(item.key, 1)}
                className={`p-2 rounded-xl transition-all ${values[item.key] === 1 ? 'bg-red-100' : 'hover:bg-gray-200 opacity-30 grayscale'}`}
              >
                <Frown size={24} className="text-red-500" />
              </button>
              <button 
                onClick={() => handleChange(item.key, 2)}
                className={`p-2 rounded-xl transition-all ${values[item.key] === 2 ? 'bg-yellow-100' : 'hover:bg-gray-200 opacity-30 grayscale'}`}
              >
                <Meh size={24} className="text-yellow-500" />
              </button>
              <button 
                onClick={() => handleChange(item.key, 3)}
                className={`p-2 rounded-xl transition-all ${values[item.key] === 3 ? 'bg-green-100' : 'hover:bg-gray-200 opacity-30 grayscale'}`}
              >
                <Smile size={24} className="text-green-500" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Salud General del Equipo</p>
        <p className={`text-2xl font-black ${status.color}`}>
          {status.label}
        </p>
      </div>
    </div>
  );
};

export default HealthCheckCard;
