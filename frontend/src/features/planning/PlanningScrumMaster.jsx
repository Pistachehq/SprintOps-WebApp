import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BackButton from '../../components/ui/BackButton';
import { 
  Users, Chart, 
  Settings, 
  ShieldAlert,
  Zap,
  TrendingUp,
  Target
} from 'lucide-react';

const PlanningScrumMaster = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 mb-8">
        <BackButton />
        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Gestión del Equipo (Scrum Master)</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card-oracle bg-slate-900 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Zap size={24} className="text-oracle-red" />
            <h3 className="font-bold uppercase tracking-widest text-xs">Capacidad del Sprint</h3>
          </div>
          <p className="text-4xl font-black mb-1">110%</p>
          <p className="text-slate-400 text-xs font-medium">Capacidad excedida por 12 pts</p>
        </div>

        <div className="card-oracle">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp size={24} className="text-green-500" />
            <h3 className="font-bold uppercase tracking-widest text-xs text-slate-400">Pronóstico Predictivo</h3>
          </div>
          <p className="text-4xl font-black text-slate-900">48 pts</p>
          <p className="text-slate-500 text-xs font-medium">Finalización estimada: 2 días antes</p>
        </div>

        <div className="card-oracle">
          <div className="flex items-center gap-3 mb-4">
            <ShieldAlert size={24} className="text-red-500" />
            <h3 className="font-bold uppercase tracking-widest text-xs text-slate-400">Control de Bloqueos</h3>
          </div>
          <p className="text-4xl font-black text-slate-900">2 Activos</p>
          <p className="text-slate-500 text-xs font-medium">Requiere intervención inmediata</p>
        </div>
      </div>

      <div className="card-oracle flex-1 bg-white">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Target size={20} className="text-oracle-red" />
            Métricas de Salud del Sprint
          </h2>
          <button className="text-sm font-bold text-oracle-red hover:underline">Ver Reporte Detallado</button>
        </div>
        
        <div className="space-y-6">
          {[
            { label: 'Carga de Trabajo', value: 85, color: 'bg-green-500' },
            { label: 'Riesgo de Desfase', value: 30, color: 'bg-yellow-500' },
            { label: 'Calidad de Código', value: 92, color: 'bg-blue-500' },
            { label: 'Participación en Daily', value: 100, color: 'bg-indigo-500' }
          ].map((item, i) => (
            <div key={i}>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-slate-500 uppercase tracking-widest">{item.label}</span>
                <span className="text-slate-900">{item.value}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className={`${item.color} h-full transition-all duration-1000`} style={{ width: `${item.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlanningScrumMaster;
