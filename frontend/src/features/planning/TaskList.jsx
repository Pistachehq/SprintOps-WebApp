import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import TaskCard from './TaskCard';
import CreateIssueModal from '../issues/CreateIssueModal';
import { useIssues } from '../issues/hooks/useIssues';
import { projectsRepository } from '../../data/repositories/projectsRepository';

const TaskList = ({ role, sprintId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isOwner = role === 'productOwner';
  const isScrum = role === 'scrumMaster';
  const isDev = role === 'developer';

  const { issues, addIssue, assignIssue } = useIssues(sprintId);
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
    <div className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100 h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-black text-gray-800">Backlog del Sprint</h2>
        {isOwner && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-10 h-10 bg-[#446E51] text-white rounded-full flex items-center justify-center hover:opacity-90 transition-opacity shadow-lg shadow-green-100">
            <Plus size={24} />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {issues.map((task) => (
          <TaskCard key={task.id} task={task} role={role} sprintId={sprintId} members={members} onAssign={assignIssue} />
        ))}
      </div>

      <CreateIssueModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateIssue}
      />
    </div>
  );
};

export default TaskList;
