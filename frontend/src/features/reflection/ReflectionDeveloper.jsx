import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BackButton from '../../components/ui/BackButton';
import { 
  Smile, 
  Frown, 
  Lightbulb,
  BarChart2,
  Activity,
  Award
} from 'lucide-react';

const ReflectionDeveloper = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full pb-8">
      <div className="flex items-center gap-4 mb-8">
        <BackButton />

        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Reflexión y Retrospectiva</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulario Retrospectiva */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Lightbulb size={20} className="text-oracle-red" />
            Feedback del Equipo
          </h2>
          
          <div className="card-oracle space-y-4">
            <div>
              <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                <Smile size={16} className="text-green-500" /> Lo mejor del sprint
              </label>
              <textarea 
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-oracle-red focus:bg-white outline-none transition-all"
                placeholder="¿Qué salió bien?"
                rows="3"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                <Frown size={16} className="text-red-500" /> Lo peor del sprint
              </label>
              <textarea 
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-oracle-red focus:bg-white outline-none transition-all"
                placeholder="¿Qué dificultades tuvimos?"
                rows="3"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                <Lightbulb size={16} className="text-yellow-500" /> Cosas a mejorar
              </label>
              <textarea 
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-oracle-red focus:bg-white outline-none transition-all"
                placeholder="Acciones para el próximo sprint..."
                rows="3"
              />
            </div>

            <button className="btn-primary w-full">Guardar Retrospectiva</button>
          </div>
        </div>

        {/* Métricas del Sprint */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <BarChart2 size={20} className="text-oracle-red" />
            Métricas de Desempeño
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="card-oracle flex flex-col items-center justify-center text-center">
              <Activity size={32} className="text-oracle-red mb-2" />
              <p className="text-2xl font-black">48/52</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Velocidad Historica</p>
            </div>
            <div className="card-oracle flex flex-col items-center justify-center text-center">
              <Award size={32} className="text-blue-500 mb-2" />
              <p className="text-2xl font-black">94%</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Participación Standup</p>
            </div>
            <div className="card-oracle flex flex-col items-center justify-center text-center">
              <Target size={32} className="text-green-500 mb-2" />
              <p className="text-2xl font-black">8.5</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Health Check</p>
            </div>
            <div className="card-oracle flex flex-col items-center justify-center text-center">
              <Zap size={32} className="text-yellow-500 mb-2" />
              <p className="text-2xl font-black">Normal</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimación de deuda</p>
            </div>
          </div>

          <div className="card-oracle bg-slate-900 border-none shadow-xl">
             <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Sprint Burn-down</p>
             <div className="flex items-end gap-2 h-32">
                {[40, 60, 50, 45, 30, 25, 20, 10].map((h, i) => (
                  <div key={i} className="flex-1 bg-oracle-red rounded-t opacity-80" style={{ height: `${h}%` }} />
                ))}
             </div>
             <p className="text-center text-[10px] font-bold text-slate-500 mt-4 italic">El equipo mantiene un ritmo constante de entrega.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReflectionDeveloper;
