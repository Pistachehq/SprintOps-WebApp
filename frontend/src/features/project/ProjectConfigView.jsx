import React, { useState } from 'react';
import { Settings, Plus, Users, LayoutList, Trash2, Pencil, X, Check } from 'lucide-react';
import AddUserModal from '../../components/ui/AddUserModal';
import { useSprints } from '../sprint/hooks/useSprints';
import { useAuth } from '../auth/hooks/useAuth';
import { sprintsRepository } from '../../data/repositories/sprintsRepository';

const ProjectConfigView = ({ projectId, project, onClose }) => {
  const { sprints, addSprint, updateSprint } = useSprints(projectId);
  const { checkPermission } = useAuth();
  
  const [sprintName, setSprintName] = useState('');
  const [sprintGoal, setSprintGoal] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [showAddMember, setShowAddMember] = useState(false);
  const [localMembers, setLocalMembers] = useState([
    { name: 'Axel De Gyves', email: 'axel@mock.com', role: 'Developer' }
  ]);

  // Editing sprint inline
  const [editingSprintId, setEditingSprintId] = useState(null);
  const [editSprintName, setEditSprintName] = useState('');
  const [editSprintStatus, setEditSprintStatus] = useState('');

  // Editing member inline
  const [editingMemberIdx, setEditingMemberIdx] = useState(null);
  const [editMemberRole, setEditMemberRole] = useState('');
  
  const canManageMembers = checkPermission('canManageMembers');
  const canCreateSprint = checkPermission('canCreateSprint');

  const handleAddSprint = (e) => {
    e.preventDefault();
    addSprint({
      projectId,
      name: sprintName,
      goal: sprintGoal,
      status: 'planned',
      startDate,
      endDate
    });
    setSprintName('');
    setSprintGoal('');
    setStartDate('');
    setEndDate('');
  };

  const handleDeleteSprint = (sprintId) => {
    if (confirm('¿Estás seguro de eliminar este sprint?')) {
      sprintsRepository.delete(sprintId);
    }
  };

  const startEditSprint = (sprint) => {
    setEditingSprintId(sprint.id);
    setEditSprintName(sprint.name);
    setEditSprintStatus(sprint.status);
  };

  const saveEditSprint = () => {
    updateSprint(editingSprintId, { name: editSprintName, status: editSprintStatus });
    setEditingSprintId(null);
  };

  const handleDeleteMember = (idx) => {
    setLocalMembers(localMembers.filter((_, i) => i !== idx));
  };

  const startEditMember = (idx) => {
    setEditingMemberIdx(idx);
    setEditMemberRole(localMembers[idx].role);
  };

  const saveEditMember = () => {
    const updated = [...localMembers];
    updated[editingMemberIdx] = { ...updated[editingMemberIdx], role: editMemberRole };
    setLocalMembers(updated);
    setEditingMemberIdx(null);
  };

  const handleAddMember = (user) => {
    setLocalMembers([...localMembers, { name: user.name, email: `${user.name.split(' ')[0].toLowerCase()}@mock.com`, role: user.role }]);
  };

  return (
    <div className="absolute inset-0 bg-[#F0EFED] z-30 flex flex-col overflow-y-auto">
      <div className="h-[80px] px-10 flex items-center justify-between shrink-0">
        <button onClick={onClose} className="text-[#446E51] font-bold hover:underline flex items-center gap-2">
           ← Volver a Sprints
        </button>
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <Settings /> Configuración del Proyecto
        </h2>
      </div>

      <div className="flex-1 p-10 max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Sprints Config */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
          <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
            <LayoutList className="text-[#446E51]" /> Gestionar Sprints
          </h3>
          
          <div className="space-y-4 mb-8">
            {sprints.map(s => (
              <div key={s.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                {editingSprintId === s.id ? (
                  <div className="space-y-3">
                    <input 
                      value={editSprintName} 
                      onChange={e => setEditSprintName(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#446E51] text-sm font-bold"
                    />
                    <select 
                      value={editSprintStatus}
                      onChange={e => setEditSprintStatus(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#446E51] text-sm"
                    >
                      <option value="planned">Planned</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                    <div className="flex gap-2">
                      <button onClick={saveEditSprint} className="flex-1 h-9 bg-[#446E51] text-white rounded-lg text-sm font-bold flex items-center justify-center gap-1">
                        <Check size={14} /> Guardar
                      </button>
                      <button onClick={() => setEditingSprintId(null)} className="flex-1 h-9 bg-gray-100 text-slate-600 rounded-lg text-sm font-bold flex items-center justify-center gap-1">
                        <X size={14} /> Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-800">{s.name}</h4>
                      <p className="text-xs text-slate-500">{s.startDate} - {s.endDate}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 text-[10px] font-black uppercase text-white bg-[#446E51] rounded">
                        {s.status}
                      </span>
                      <button onClick={() => startEditSprint(s)} className="p-1.5 text-slate-400 hover:text-[#446E51] hover:bg-green-50 rounded-lg transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDeleteSprint(s.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {sprints.length === 0 && (
              <p className="text-sm text-slate-400 italic">No hay sprints creados.</p>
            )}
          </div>

          {canCreateSprint && (
            <form onSubmit={handleAddSprint} className="space-y-4 border-t pt-6">
              <h4 className="font-bold text-sm text-slate-700">Agregar Nuevo Sprint</h4>
              <input required value={sprintName} onChange={e=>setSprintName(e.target.value)} placeholder="Nombre del Sprint (ej. Sprint 3)" className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#446E51]" />
              <input value={sprintGoal} onChange={e=>setSprintGoal(e.target.value)} placeholder="Meta del Sprint" className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#446E51]" />
              <div className="grid grid-cols-2 gap-4">
                <input required type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#446E51] text-sm text-slate-600" />
                <input required type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#446E51] text-sm text-slate-600" />
              </div>
              <button type="submit" className="w-full h-12 bg-[#446E51] text-white font-bold rounded-xl flex justify-center items-center gap-2 hover:opacity-90">
                <Plus size={18} /> Crear Sprint
              </button>
            </form>
          )}
        </div>

        {/* Members Config */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 h-fit">
          <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
            <Users className="text-[#446E51]" /> Roles de Equipo
          </h3>
          <p className="text-sm text-slate-500 mb-6">Gestiona a los miembros asignados en general a este proyecto.</p>
          
          <div className="space-y-4">
            {localMembers.map((m, idx) => (
              <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                {editingMemberIdx === idx ? (
                  <div className="space-y-3">
                    <p className="font-bold text-slate-800 text-sm">{m.name}</p>
                    <select
                      value={editMemberRole}
                      onChange={e => setEditMemberRole(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#446E51] text-sm"
                    >
                      <option value="Developer">Desarrollador</option>
                      <option value="Scrum Master">Scrum Master</option>
                      <option value="Product Owner">Product Owner</option>
                      <option value="Desarrollador">Desarrollador</option>
                    </select>
                    <div className="flex gap-2">
                      <button onClick={saveEditMember} className="flex-1 h-9 bg-[#446E51] text-white rounded-lg text-sm font-bold flex items-center justify-center gap-1">
                        <Check size={14} /> Guardar
                      </button>
                      <button onClick={() => setEditingMemberIdx(null)} className="flex-1 h-9 bg-gray-100 text-slate-600 rounded-lg text-sm font-bold flex items-center justify-center gap-1">
                        <X size={14} /> Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-800">{m.name}</h4>
                      <p className="text-xs text-slate-500">{m.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 text-[10px] font-black uppercase text-[#446E51] bg-[#446E51]/10 rounded">
                        {m.role}
                      </span>
                      <button onClick={() => startEditMember(idx)} className="p-1.5 text-slate-400 hover:text-[#446E51] hover:bg-green-50 rounded-lg transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDeleteMember(idx)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {canManageMembers && (
            <button 
              onClick={() => setShowAddMember(true)}
              className="mt-6 w-full h-12 border-2 border-dashed border-[#446E51] text-[#446E51] font-bold rounded-xl flex justify-center items-center gap-2 hover:bg-[#446E51]/5"
            >
              <Plus size={18} /> Asignar Nuevo Miembro
            </button>
          )}
        </div>
      </div>
      
      <AddUserModal
        isOpen={showAddMember}
        onClose={() => setShowAddMember(false)}
        onAdd={handleAddMember}
      />
    </div>
  );
};

export default ProjectConfigView;
