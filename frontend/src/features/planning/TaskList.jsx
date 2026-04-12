import React, { useState, useEffect } from 'react';
import { Plus, Pencil } from 'lucide-react';
import TaskCard from './TaskCard';
import CreateIssueModal from '../issues/CreateIssueModal';
import { projectsRepository } from '../../data/repositories/projectsRepository';
import { useAuth } from '../auth/hooks/useAuth';

const TaskList = ({ role, sprintId, issuesData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const { checkPermission } = useAuth();
  const canCreateIssue = checkPermission('canCreateIssue');
  const canEditIssue = checkPermission('canEditIssue');

  const { issues, addIssue, deleteIssue, assignIssue } = issuesData;
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (issues.length > 0 && issues[0].projectId) {
      projectsRepository.getMembers(issues[0].projectId).then(m => setMembers(m || [])).catch(() => {});
    }
  }, [issues]);

  const handleCreateIssue = (issueData) => {
    addIssue({ ...issueData, sprintId });
  };

  return (
    <div className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100 h-full min-h-0 flex flex-col">
      <div className="flex justify-between items-center mb-8 shrink-0">
        <h2 className="text-2xl font-black text-gray-800">Backlog del Sprint</h2>
        <div className="flex items-center gap-3">
          {canEditIssue && (
            <button 
              onClick={() => setEditMode(!editMode)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg ${
                editMode 
                  ? 'bg-red-500 text-white shadow-red-100' 
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300 shadow-gray-100'
              }`}
              title={editMode ? 'Salir de modo edición' : 'Modo edición'}
            >
              <Pencil size={18} />
            </button>
          )}
          {canCreateIssue && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-10 h-10 bg-[#446E51] text-white rounded-full flex items-center justify-center hover:opacity-90 transition-opacity shadow-lg shadow-green-100">
              <Plus size={24} />
            </button>
          )}
        </div>
      </div>

      <div className="overflow-y-auto space-y-4 flex-1 min-h-0" style={{ scrollbarWidth: 'thin' }}>
        {issues.map((task) => (
          <TaskCard key={task.id} task={task} role={role} sprintId={sprintId} members={members} onAssign={assignIssue} editMode={editMode} onDelete={deleteIssue} />
        ))}
      </div>

      <CreateIssueModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateIssue}
        sprintIssues={issues}
      />
    </div>
  );
};

export default TaskList;
