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
      <div className="flex items-center gap-3 flex-wrap">
        {assignedMembers.map((member) => (
          <div
            key={member.userId}
            className="w-12 h-12 rounded-full bg-[#446E51] ring-2 ring-white shadow-sm flex items-center justify-center text-white font-bold text-lg uppercase"
            title={member.name}
          >
            {member.name.charAt(0)}
          </div>
        ))}

        {canAdd && (
          <button
            onClick={() => setShowModal(true)}
            className="w-12 h-12 rounded-full bg-[#446E51] ring-2 ring-white shadow-sm flex items-center justify-center text-white hover:bg-[#355640] transition-colors"
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
