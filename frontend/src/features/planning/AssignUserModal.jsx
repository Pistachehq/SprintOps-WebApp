import React, { useState } from 'react';
import { X, Search, Check } from 'lucide-react';

const roleLabel = (role) => {
  const map = { developer: 'Developer', scrumMaster: 'Scrum Master', productOwner: 'Product Owner' };
  return map[role] || role;
};

const AssignUserModal = ({ isOpen, onClose, members = [], assigneeIds = [], onToggle }) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
          <h2 className="text-xl font-black text-gray-800 tracking-tight">Asignar Miembros</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-4">
          <div className="relative mb-4">
            <input
              className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#446E51] bg-gray-50 text-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar miembro..."
            />
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1">
            {filtered.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No se encontraron miembros.</p>
            ) : (
              filtered.map(member => {
                const isAssigned = assigneeIds.includes(member.userId);
                return (
                  <button
                    key={member.userId}
                    onClick={() => onToggle(member.userId)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                      isAssigned ? 'bg-[#446E51]/10 border border-[#446E51]/30' : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold uppercase shrink-0 ${
                      isAssigned ? 'bg-[#446E51] text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {member.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-800 truncate">{member.name}</p>
                      <p className="text-[10px] text-gray-400">{member.email} · {roleLabel(member.role)}</p>
                    </div>
                    {isAssigned && (
                      <div className="w-6 h-6 bg-[#446E51] rounded-full flex items-center justify-center shrink-0">
                        <Check size={14} className="text-white" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full h-11 bg-[#446E51] text-white font-bold rounded-xl hover:bg-[#355640] transition-colors"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignUserModal;
