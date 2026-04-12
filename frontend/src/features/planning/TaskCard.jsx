import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import AssignUserModal from './AssignUserModal';
import { useAuth } from '../auth/hooks/useAuth';

const TaskCard = ({ task, role, sprintId, members = [], onAssign, editMode = false, onDelete }) => {
  const navigate = useNavigate();
  const { checkPermission } = useAuth();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const { id, title, priority, storyPoints, description, assigneeIds = [] } = task;
  const canAssign = checkPermission('canManageMembers');
  
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
      <div className={`flex rounded-2xl overflow-hidden transition-all ${editMode ? 'border border-red-200' : 'border border-gray-100'}`}>
        <div 
          onClick={() => !editMode && navigate(`/sprint/${sprintId}/planning/task/${id}`)}
          className={`p-6 flex-1 min-w-0 transition-all ${
            editMode 
              ? 'bg-gray-50' 
              : 'bg-gray-50 hover:bg-white hover:shadow-md cursor-pointer group'
          }`}
        >
          <div className="mb-2 flex items-start justify-between gap-3">
            <h3 className="min-w-0 flex-1 text-lg font-bold text-gray-800">
              #{formattedId} {title}
            </h3>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <div className={`rounded-full px-3 py-1 text-[10px] font-black uppercase text-white ${getPriorityColor(priority)}`}>
                {priority || 'Normal'}
              </div>
              {task.tagLabel && task.tagColor && (
                <span
                  className="max-w-[140px] truncate rounded-full px-2.5 py-0.5 text-[9px] font-bold text-white shadow-sm"
                  style={{ backgroundColor: task.tagColor }}
                >
                  {task.tagLabel}
                </span>
              )}
            </div>
          </div>
          
          <p className="text-sm text-gray-500 mb-6 font-medium leading-relaxed">{description}</p>
          
          <div className="flex justify-between items-center mt-auto">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {assignedMembers.slice(0, 2).map((member) => (
                  member.avatarUrl ? (
                    <img
                      key={member.userId}
                      src={member.avatarUrl}
                      alt={member.name}
                      title={member.name}
                      className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm"
                    />
                  ) : (
                    <div 
                      key={member.userId} 
                      className="w-10 h-10 rounded-full bg-[#446E51] border-2 border-white flex items-center justify-center text-white text-xs font-bold uppercase shadow-sm"
                      title={member.name}
                    >
                      {member.name.charAt(0)}
                    </div>
                  )
                ))}
                {assignedMembers.length > 2 && (
                  <div className="w-10 h-10 rounded-full bg-[#446E51] border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    +{assignedMembers.length - 2}
                  </div>
                )}
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

        {editMode && (
          <button
            onClick={() => {
              if (confirm(`¿Eliminar el issue "#${formattedId} ${title}"?`)) {
                onDelete?.(id);
              }
            }}
            className="w-20 bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center shrink-0"
            title="Eliminar issue"
          >
            <Trash2 size={28} className="text-white" />
          </button>
        )}
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
