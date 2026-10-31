import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import AssignUserModal from './AssignUserModal';
import { AnimatedPopup } from '../../components/PopupPortal';
import PriorityBadge from '../../components/ui/PriorityBadge';
import { useAuth } from '../auth/hooks/useAuth';

const TaskCard = ({ task, role, sprintId, members = [], onAssign, editMode = false, onDelete }) => {
  const navigate = useNavigate();
  const { checkPermission } = useAuth();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { id, title, priority, storyPoints, description, assigneeIds = [] } = task;
  const canAssign = checkPermission('canManageMembers');
  
  const formattedId = task.displayIndex || id;
  const points = storyPoints || task.points || 0;

  const assignedMembers = members.filter(m => assigneeIds.includes(m.userId));

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
              <PriorityBadge priority={priority} />
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
                      className="w-10 h-10 rounded-full bg-[#67BFA1] border-2 border-white flex items-center justify-center text-white text-xs font-bold uppercase shadow-sm"
                      title={member.name}
                    >
                      {member.name.charAt(0)}
                    </div>
                  )
                ))}
                {assignedMembers.length > 2 && (
                  <div className="w-10 h-10 rounded-full bg-[#67BFA1] border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-sm">
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
                  className="text-[10px] font-black uppercase text-[#67BFA1] hover:underline"
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
            onClick={() => setConfirmDelete(true)}
            className="w-20 bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center shrink-0"
            title="Eliminar issue"
          >
            <Trash2 size={28} className="text-white" />
          </button>
        )}
      </div>

      <AnimatedPopup open={confirmDelete}>
          <div
            className="popup-overlay fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
            onClick={() => setConfirmDelete(false)}
          >
            <div
              className="popup-panel w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <h2 className="text-lg font-black text-gray-800">Eliminar issue</h2>
              <p className="mt-2 text-sm font-medium text-gray-500">
                ¿Eliminar el issue &quot;#{formattedId} {title}&quot;?
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="h-11 flex-1 rounded-xl bg-gray-100 font-bold text-slate-600 transition-colors hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmDelete(false);
                    onDelete?.(id);
                  }}
                  className="h-11 flex-1 rounded-xl bg-red-500 font-bold text-white transition-colors hover:bg-red-600"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
      </AnimatedPopup>

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
