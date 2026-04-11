import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BackButton from '../../components/ui/BackButton';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText
} from 'lucide-react';
import { useIssues } from '../issues/hooks/useIssues';
import { useAuth } from '../auth/hooks/useAuth';

const PlanningDeveloper = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { issues } = useIssues(id);

  const myTasks = issues.filter(i => i.assigneeIds?.includes(user?.id));

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 mb-8">
        <BackButton />
        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Tus Tareas Asignadas (Developer)</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">ID</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Tarea</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Estado</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Puntos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {myTasks.map(task => (
              <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-xs font-bold text-slate-400">#{task.displayIndex || task.id}</td>
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-900">{task.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{task.description}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    task.status === 'Done' ? 'bg-green-100 text-green-700' : 
                    task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {task.status === 'Done' ? <CheckCircle2 size={12} /> : 
                     task.status === 'In Progress' ? <Clock size={12} /> : <FileText size={12} />}
                    {task.status}
                  </span>
                </td>
                <td className="px-6 py-4 font-bold text-slate-900">{task.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PlanningDeveloper;
