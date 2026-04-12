import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/hooks/useAuth';

const AssignedTasksCard = ({ sprintId, issues = [] }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const roleLower = user?.role?.toLowerCase() || '';

  const myTasks = issues.filter(t => t.assigneeIds?.includes(user?.id));

  return (
    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-b pb-2">Mis Tareas Asignadas</h3>
      <div className="space-y-3">
        {myTasks.length > 0 ? myTasks.map(t => (
          <div 
            key={t.id} 
            onClick={() => navigate(`/sprint/${sprintId}/planning/task/${t.id}`)}
            className="p-3 bg-gray-50 rounded-xl flex items-center gap-3 hover:bg-[#446E51]/10 hover:shadow-sm transition-all cursor-pointer group"
          >
            <span className="font-bold text-[#446E51] text-xs">#{t.displayIndex || t.id}</span>
            <span className="text-sm font-bold text-gray-700 group-hover:text-[#446E51] transition-colors">{t.title}</span>
          </div>
        )) : (
          <p className="text-xs text-gray-400 italic text-center py-4">Sin tareas asignadas</p>
        )}
      </div>
    </div>
  );
};

export default AssignedTasksCard;
