import React, { useState } from 'react';
import { Plus, UserPlus } from 'lucide-react';
import AssignUserModal from '../AssignUserModal';

const TeamAvatars = ({ assignedMembers = [], allMembers = [], assigneeIds = [], taskId, canAdd = false, onAssign }) => {
  const [showModal, setShowModal] = useState(false);

  const handleToggle = (userId) => {
    if (!onAssign) return;
    const newIds = assigneeIds.includes(userId)
      ? assigneeIds.filter(id => id !== userId)
      : [...assigneeIds, userId];
    onAssign(taskId, newIds);
  };

  return (
    <>
      {assignedMembers.length === 0 ? (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-sm text-gray-400 italic">No hay miembros asignados a esta tarea.</p>
          {canAdd && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#446E51] text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity"
            >
              <UserPlus size={16} /> Asignar
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {assignedMembers.map((member) => (
            <div key={member.userId} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
              {member.avatarUrl ? (
                <img
                  src={member.avatarUrl}
                  alt={member.name}
                  className="w-10 h-10 rounded-full object-cover shadow-sm"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#446E51] shadow-sm flex items-center justify-center text-white font-bold text-sm uppercase">
                  {member.name.charAt(0)}
                </div>
              )}
              <span className="text-sm font-bold text-gray-800">{member.name}</span>
            </div>
          ))}

          {canAdd && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 w-full p-3 text-[#446E51] font-bold text-sm rounded-xl border-2 border-dashed border-gray-200 hover:border-[#446E51] hover:bg-[#446E51]/5 transition-all justify-center"
            >
              <Plus size={16} /> Asignar miembro
            </button>
          )}
        </div>
      )}

      <AssignUserModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        members={allMembers}
        assigneeIds={assigneeIds}
        onToggle={handleToggle}
      />
    </>
  );
};

export default TeamAvatars;
