import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AssignUserModal from './AssignUserModal';

const TaskCard = ({ task, role, sprintId, members = [], onAssign }) => {
  const navigate = useNavigate();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const { id, title, priority, storyPoints, description, assigneeIds = [] } = task;
  const canAssign = role === 'scrumMaster' || role === 'productOwner' || role === 'developer';
  
  const formattedId = task.displayIndex || id;
  const points = storyPoints || task.points || 0;

  const assignedMembers = members.filter(m => assigneeIds.includes(m.userId));

  const getPriorityColor = (p) => {
    switch(p?.toLowerCase()) {
      case 'high':
      case 'alta': return 'bg-red-500';
      case 'medium':
      case 'media': return 'bg-yellow-500';
      case 'low':
      case 'baja': return 'bg-green-500';
      default: return 'bg-gray-400';
    }
  };

  const handleAssign = (userId) => {
    const newIds = assigneeIds.includes(userId)
      ? assigneeIds.filter(aid => aid !== userId)
      : [...assigneeIds, userId];
    onAssign(id, newIds);
  };

  return (
    <>
      <div 
        onClick={() => navigate(`/sprint/${sprintId}/planning/task/${id}`)}
        className="p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:border-[#446E51]/30 hover:bg-white hover:shadow-md transition-all group cursor-pointer"
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-gray-800 text-lg">#{formattedId} {title}</h3>
          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase text-white ${getPriorityColor(priority)}`}>
            {priority || 'Normal'}
          </div>
        </div>
        
        <p className="text-sm text-gray-500 mb-6 font-medium leading-relaxed">{description}</p>
        
        <div className="flex justify-between items-center mt-auto">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {assignedMembers.map((member) => (
                <div 
                  key={member.userId} 
                  className="w-10 h-10 rounded-full bg-[#446E51] border-2 border-white flex items-center justify-center text-white text-xs font-bold uppercase shadow-sm"
                  title={member.name}
                >
                  {member.name.charAt(0)}
                </div>
              ))}
            </div>

            {canAssign && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAssignModal(true);
                }}
                className="text-[10px] font-black uppercase text-[#446E51] hover:underline"
              >
                + Asignar
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Story Points:</span>
            <span className="text-lg font-black text-gray-800">{points}</span>
          </div>
        </div>
      </div>

      <AssignUserModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        members={members}
        assigneeIds={assigneeIds}
        onToggle={handleAssign}
      />
    </>
  );
};

export default TaskCard;
