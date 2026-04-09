import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import AddUserModal from '../../../components/ui/AddUserModal';

const TeamAvatars = ({ members: initialMembers = [], canAdd = false }) => {
  const [members, setMembers] = useState(initialMembers);
  const [showModal, setShowModal] = useState(false);

  const handleAdd = (newUser) => {
    setMembers(prev => [...prev, newUser.name]);
  };

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap">
        {members.map((member, index) => (
          <div
            key={index}
            className="w-12 h-12 rounded-full bg-[#446E51] ring-2 ring-white shadow-sm flex items-center justify-center text-white font-bold text-lg uppercase"
            title={typeof member === 'string' ? member : member.name}
          >
            {typeof member === 'string' ? member.charAt(0) : member.name?.charAt(0)}
          </div>
        ))}

        {/* Add Member Button — only visible for scrumMaster */}
        {canAdd && (
          <button
            onClick={() => setShowModal(true)}
            className="w-12 h-12 rounded-full bg-[#446E51] ring-2 ring-white shadow-sm flex items-center justify-center text-white hover:bg-[#355640] transition-colors"
            title="Agregar miembro"
          >
            <Plus size={22} />
          </button>
        )}
      </div>

      <AddUserModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAdd={handleAdd}
      />
    </>
  );
};

export default TeamAvatars;
