import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/hooks/useAuth';
import { ChevronRight, ClipboardList } from 'lucide-react';

const DevTasksView = ({ sprintId, issuesData }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { issues } = issuesData;

  // Filter tasks assigned to the current dev user
  const myTasks = issues.filter(t => t.assigneeIds?.includes(user?.id));

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[24px] border border-gray-100 bg-white p-10 pb-8 shadow-sm">
      <div className="flex items-center gap-4 mb-3 shrink-0">
        <div className="w-12 h-12 bg-[#446E51]/10 rounded-xl flex items-center justify-center">
          <ClipboardList size={24} className="text-[#446E51]" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-gray-800">Mis Tareas</h2>
          <p className="text-sm text-gray-400 font-medium">
            Estas son las tareas que están asignadas a ti para este sprint.
          </p>
        </div>
      </div>

      <div className="border-t border-gray-100 my-6 shrink-0" />

      {myTasks.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ClipboardList size={28} className="text-gray-300" />
          </div>
          <p className="text-gray-400 font-bold text-lg">No tienes tareas asignadas</p>
          <p className="text-gray-300 text-sm mt-2 max-w-md mx-auto">
            Las tareas aparecerán aquí cuando se te asignen.
          </p>
        </div>
      ) : (
        <div className="space-y-5 overflow-y-auto flex-1 min-h-0 pb-4 pr-1 -mr-1" style={{ scrollbarWidth: 'thin' }}>
          {myTasks.map(task => (
            <div
              key={task.id}
              onClick={() => navigate(`/sprint/${sprintId}/planning/task/${task.id}`)}
              className="p-6 bg-[#F0EFED] rounded-2xl flex items-center justify-between group hover:bg-[#446E51]/10 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-black text-[#446E51] text-sm bg-[#446E51]/10 px-2 py-0.5 rounded">#{task.displayIndex || task.id}</span>
                  <h3 className="text-lg font-bold text-gray-800 group-hover:text-[#446E51] transition-colors">{task.title}</h3>
                </div>
                {task.description && (
                  <p className="text-sm text-gray-500 leading-relaxed">{task.description}</p>
                )}
              </div>
              
              <ChevronRight size={24} className="text-gray-300 group-hover:text-[#446E51] transition-colors ml-6 shrink-0" />
            </div>
          ))}

          <p className="text-xs text-gray-300 text-center pt-4">
            {myTasks.length} tarea{myTasks.length !== 1 ? 's' : ''} asignada{myTasks.length !== 1 ? 's' : ''} en este sprint
          </p>
        </div>
      )}
    </div>
  );
};

export default DevTasksView;
