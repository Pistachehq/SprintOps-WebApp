import React, { useState } from 'react';
import { Plus } from 'lucide-react';
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
      <div className="flex items-center -space-x-3">
        {assignedMembers.slice(0, 2).map((member) => (
          member.avatarUrl ? (
            <img
              key={member.userId}
              src={member.avatarUrl}
              alt={member.name}
              title={member.name}
              className="w-12 h-12 rounded-full ring-2 ring-white object-cover shadow-sm"
            />
          ) : (
            <div
              key={member.userId}
              className="w-12 h-12 rounded-full bg-[#446E51] ring-2 ring-white shadow-sm flex items-center justify-center text-white font-bold text-lg uppercase"
              title={member.name}
            >
              {member.name.charAt(0)}
            </div>
          )
        ))}
        {assignedMembers.length > 2 && (
          <div className="w-12 h-12 rounded-full bg-[#446E51] ring-2 ring-white shadow-sm flex items-center justify-center text-white font-bold text-sm">
            +{assignedMembers.length - 2}
          </div>
        )}

        {canAdd && (
          <button
            onClick={() => setShowModal(true)}
            className="w-12 h-12 rounded-full bg-[#446E51] ring-2 ring-white shadow-sm flex items-center justify-center text-white hover:bg-[#355640] transition-colors ml-3"
            title="Asignar miembro"
          >
            <Plus size={22} />
          </button>
        )}
      </div>

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
