import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BackButton from '../../components/ui/BackButton';
import { 
  Plus, 
  UserPlus, 
  GitPullRequest,
  Search,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useIssues } from '../issues/hooks/useIssues';

const PlanningProductOwner = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { issues } = useIssues(id);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Gestión del Backlog (Product Owner)</h1>
        </div>
        
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-slate-900 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all">
            <UserPlus size={18} /> Gestionar Equipo
          </button>
          <button className="flex items-center gap-2 px-4 py-2 btn-primary rounded-xl text-sm font-bold shadow-lg shadow-red-100">
            <Plus size={18} /> Nueva Tarea
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full overflow-hidden">
        <div className="flex flex-col h-full card-oracle border-2 border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2 text-slate-900 uppercase tracking-widest text-xs">
              <GitPullRequest size={16} className="text-oracle-red" />
              Product Backlog (Prioridad Alta)
            </h3>
            <span className="bg-oracle-red text-white text-[10px] font-black px-2 py-0.5 rounded-full">12</span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-oracle-red cursor-pointer transition-all">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black text-slate-400">PBI-0{i}</span>
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-black rounded uppercase">Urgente</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">Módulo de Reportes Analíticos</h4>
                <div className="flex items-center gap-2 mt-3 text-slate-400 text-[10px] font-bold">
                  <Clock size={12} />
                  <span>Agregado hace 2 días</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col h-full card-oracle border-2 border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2 text-slate-900 uppercase tracking-widest text-xs">
              <CheckCircle size={16} className="text-green-500" />
              Asignación Actual del Sprint
            </h3>
            <span className="bg-slate-900 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{issues.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {issues.map(issue => (
              <div key={issue.id} className="p-4 bg-white border border-gray-100 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{issue.title}</h4>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Asignado a: {issue.assignedTo}</p>
                </div>
                <button className="text-[10px] font-black text-oracle-red hover:underline uppercase">Editar</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanningProductOwner;
