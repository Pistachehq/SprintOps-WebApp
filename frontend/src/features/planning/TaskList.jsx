import React from 'react';
import { Plus } from 'lucide-react';
import TaskCard from './TaskCard';
import { useIssues } from '../issues/hooks/useIssues';

const TaskList = ({ role, sprintId }) => {
  const isOwner = role === 'productOwner';
  const isScrum = role === 'scrumMaster';
  const isDev = role === 'developer';

  const { issues } = useIssues(sprintId);

  return (
    <div className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100 h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-black text-gray-800">Backlog del Sprint</h2>
        {isOwner && (
          <button className="w-10 h-10 bg-[#446E51] text-white rounded-full flex items-center justify-center hover:opacity-90 transition-opacity shadow-lg shadow-green-100">
            <Plus size={24} />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {issues.map((task) => (
          <TaskCard key={task.id} task={task} role={role} sprintId={sprintId} />
        ))}
      </div>
    </div>
  );
};

export default TaskList;
