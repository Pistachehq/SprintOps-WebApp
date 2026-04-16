import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Settings, Plus, Users, LayoutList, Trash2, Pencil, X, Check, Copy, ChevronLeft, Calendar, Shield, Eye, Search, SlidersHorizontal, MessageCircle } from 'lucide-react';
import { useAuth } from '../auth/hooks/useAuth';
import { sprintsRepository } from '../../data/repositories/sprintsRepository';
import { projectsRepository } from '../../data/repositories/projectsRepository';
import { rolesRepository } from '../../data/repositories/rolesRepository';
import CreateRoleModal from './CreateRoleModal';
import TelegramLinkCard from './TelegramLinkCard';

// Función para convertir status a display format
const getStatusDisplay = (status) => {
  const statusMap = {
    'planned': 'Planned',
    'in_progress': 'In Progress',
    'completed': 'Finished'
  };
  return statusMap[status] || status;
};

// Función para convertir fecha a formato YYYY-MM-DD sin desfase de zona horaria
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  // Si ya está en formato YYYY-MM-DD, devolverlo tal cual
  if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  // Si es un objeto Date o string ISO
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Función para formatear fecha en texto legible sin desfase
const formatDateDisplay = (dateString) => {
  if (!dateString) return 'No definida';
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
};

const ProjectConfigView = ({
  projectId,
  project,
  onClose,
  sprints = [],
  sprintActions,
  onProjectUpdated,
  focusSprintsSection = false,
}) => {
  const { addSprint, updateSprint, refetchSprints } = sprintActions || {};
  const { user, checkPermission, refreshPermissions, refreshPermissionsForProject } = useAuth();
  
  const [sprintName, setSprintName] = useState('');
  const [sprintGoal, setSprintGoal] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sprintCapacity, setSprintCapacity] = useState('');
  const [sprintSearch, setSprintSearch] = useState('');
  const [showSprintCreate, setShowSprintCreate] = useState(false);
  
  const [localMembers, setLocalMembers] = useState([]);
  const [copied, setCopied] = useState(false);

  // Roles management state
  const [roles, setRoles] = useState([]);
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [expandedRoleId, setExpandedRoleId] = useState(null);
  const [rolePermisos, setRolePermisos] = useState({});

  const loadMembers = useCallback(async () => {
    try {
      const members = await projectsRepository.getMembers(projectId);
      setLocalMembers(members || []);
    } catch {
      setLocalMembers([]);
    }
  }, [projectId]);

  const loadRoles = useCallback(async () => {
    try {
      const projectRoles = await rolesRepository.getByProject(projectId);
      setRoles(projectRoles);
    } catch (err) {
      console.error('Error loading roles:', err);
    }
  }, [projectId]);

  useEffect(() => {
    loadMembers();
    loadRoles();
    refreshPermissionsForProject(projectId);
  }, [projectId, loadMembers, loadRoles, refreshPermissionsForProject]);

  const handleDeleteRole = async (roleId) => {
    if (confirm('¿Estás seguro de eliminar este rol?')) {
      try {
        await rolesRepository.delete(roleId);
        await loadRoles();
        await refreshPermissionsForProject(projectId);
      } catch (err) {
        console.error('Error deleting role:', err);
      }
    }
  };

  const toggleRoleExpand = async (roleId) => {
    if (expandedRoleId === roleId) {
      setExpandedRoleId(null);
      return;
    }
    setExpandedRoleId(roleId);
    if (!rolePermisos[roleId]) {
      try {
        const permisos = await rolesRepository.getPermisos(roleId);
        setRolePermisos(prev => ({ ...prev, [roleId]: permisos }));
      } catch (err) {
        console.error('Error loading role permisos:', err);
      }
    }
  };

  // Editing sprint inline
  const [editingSprintId, setEditingSprintId] = useState(null);
  const [editSprintName, setEditSprintName] = useState('');
  const [editSprintStatus, setEditSprintStatus] = useState('');

  // Editing member inline
  const [editingMemberIdx, setEditingMemberIdx] = useState(null);
  const [editMemberRole, setEditMemberRole] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [memberRoleFilters, setMemberRoleFilters] = useState(new Set());
  const [showRoleFilter, setShowRoleFilter] = useState(false);

  // Editing project end date
  const [isEditingProjectEndDate, setIsEditingProjectEndDate] = useState(false);
  const [newProjectEndDate, setNewProjectEndDate] = useState(formatDateForInput(project?.end || ''));

  useEffect(() => {
    if (!isEditingProjectEndDate) {
      setNewProjectEndDate(formatDateForInput(project?.end || ''));
    }
  }, [project?.end, isEditingProjectEndDate]);

  const canCreateSprint = checkPermission('canCreateSprint');
  const canManageMembers = checkPermission('canManageMembers');
  const canEditProjectDates = checkPermission('canEditProjectDates');

  useEffect(() => {
    if (!focusSprintsSection) return;
    const t = window.setTimeout(() => {
      document.getElementById('config-sprints-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (canCreateSprint) setShowSprintCreate(true);
    }, 150);
    return () => window.clearTimeout(t);
  }, [focusSprintsSection, canCreateSprint]);

  const filteredSprints = useMemo(() => {
    const q = sprintSearch.toLowerCase().trim();
    return sprints.filter(s => {
      if (!q) return true;
      const blob = `${s.name || ''} ${s.goal || ''} ${s.startDate || ''} ${s.endDate || ''} ${getStatusDisplay(s.status)}`.toLowerCase();
      return blob.includes(q);
    });
  }, [sprints, sprintSearch]);

  const handleAddSprint = async (e) => {
    e.preventDefault();
    if (!addSprint) return;
    try {
      await addSprint({
        projectId,
        name: sprintName,
        goal: sprintGoal,
        status: 'planned',
        startDate,
        endDate,
        capacity: sprintCapacity ? parseInt(sprintCapacity) : null
      });
      setSprintName('');
      setSprintGoal('');
      setStartDate('');
      setEndDate('');
      setSprintCapacity('');
      setShowSprintCreate(false);
    } catch (err) {
      console.error('Error al crear sprint:', err);
    }
  };

  const handleDeleteSprint = async (sprintId) => {
    if (!confirm('¿Estás seguro de eliminar este sprint?')) return;
    try {
      await sprintsRepository.delete(sprintId);
      await refetchSprints?.();
    } catch (err) {
      console.error('Error al eliminar sprint:', err);
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

  const handleDeleteMember = async (idx) => {
    setLocalMembers(localMembers.filter((_, i) => i !== idx));
    await loadMembers();
  };

  const startEditMember = (idx) => {
    setEditingMemberIdx(idx);
    setEditMemberRole(localMembers[idx].role);
  };

  const saveEditMember = async () => {
    const member = localMembers[editingMemberIdx];
    try {
      await projectsRepository.updateMemberRole(projectId, member.userId, editMemberRole);
      const updated = [...localMembers];
      updated[editingMemberIdx] = { ...updated[editingMemberIdx], role: editMemberRole };
      setLocalMembers(updated);
      if (member.userId === user?.id) {
        refreshPermissions(editMemberRole);
      }
      await loadMembers();
      await refreshPermissionsForProject(projectId);
    } catch (err) {
      console.error('Error updating member role:', err);
    }
    setEditingMemberIdx(null);
  };

  const handleCopyCode = () => {
    if (project.codigo) {
      navigator.clipboard.writeText(project.codigo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveProjectEndDate = async () => {
    if (!newProjectEndDate) return;
    try {
      await projectsRepository.update(projectId, { end: newProjectEndDate });
      setIsEditingProjectEndDate(false);
      await onProjectUpdated?.();
    } catch (err) {
      console.error('Error al actualizar fecha del proyecto:', err);
    }
  };

  const handleOpenEditProjectEndDate = () => {
    setNewProjectEndDate(formatDateForInput(project?.end));
    setIsEditingProjectEndDate(true);
  };

  return (
    <div className="fixed top-[70px] left-0 right-0 bottom-0 bg-[#F0EFED] z-30 flex flex-col overflow-hidden">
      <div className="h-[80px] px-10 flex items-center justify-between shrink-0 bg-[#F0EFED] border-b border-slate-200">
        <button onClick={onClose} className="text-[#446E51] font-bold hover:underline flex items-center gap-2" title="Volver a Sprints">
          <ChevronLeft size={20} /> Volver a Sprints
        </button>
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <Settings /> Configuración del Proyecto
        </h2>
      </div>

      <div className="flex-1 p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto w-full">
          {/* Project Code Section */}
          <div className="bg-gradient-to-r from-[#446E51] to-[#2d4f39] rounded-2xl p-8 shadow-sm border border-[#446E51] mb-10">
            <p className="text-xs font-bold text-white/80 uppercase tracking-widest mb-3">Código del Proyecto</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-5xl font-black text-white tracking-widest">
                  {project.codigo || '00000'}
                </p>
                <p className="text-sm text-white/70 mt-2">Comparte este código con tu equipo para que puedan unirse</p>
              </div>
              <button
                onClick={handleCopyCode}
                className="px-6 py-4 bg-white text-[#446E51] rounded-xl font-bold flex items-center gap-2 hover:bg-gray-100 transition-colors"
                title="Copiar código"
              >
                {copied ? <>
                  <Check size={20} /> Copiado
                </> : <>
                  <Copy size={20} /> Copiar
                </>}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 mb-10">
            <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
              <MessageCircle className="text-[#446E51]" /> Telegram (un bot para todos)
            </h3>
            <TelegramLinkCard userId={user?.id} suggestedProjectId={projectId} />
          </div>

          {/* Project Info Section */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 mb-10">
            <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
              <Calendar className="text-[#446E51]" /> Acerca del Proyecto
            </h3>
            
            {/* Project Name */}
            <div className="mb-8">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Nombre del Proyecto</p>
              <p className="text-lg font-black text-slate-800">{project?.name || 'Sin nombre'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Start Date */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Fecha de Inicio</p>
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-[#446E51]" />
                  <p className="text-lg font-black text-slate-800">
                    {formatDateDisplay(project?.start)}
                  </p>
                </div>
              </div>

              {/* End Date */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Fecha de Finalización</p>
                {isEditingProjectEndDate ? (
                  <div className="flex gap-2 items-center">
                    <input 
                      type="date" 
                      value={newProjectEndDate}
                      onChange={e => setNewProjectEndDate(e.target.value)}
                      className="flex-1 h-10 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#446E51] text-sm"
                    />
                    <button 
                      onClick={handleSaveProjectEndDate}
                      className="px-3 py-2 bg-[#446E51] text-white rounded-lg font-bold flex items-center justify-center hover:opacity-90 transition-opacity"
                      title="Guardar"
                    >
                      <Check size={16} />
                    </button>
                    <button 
                      onClick={() => setIsEditingProjectEndDate(false)}
                      className="px-3 py-2 bg-gray-200 text-slate-600 rounded-lg font-bold flex items-center justify-center hover:opacity-90 transition-opacity"
                      title="Cancelar"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Calendar size={18} className="text-[#446E51]" />
                      <p className="text-lg font-black text-slate-800">
                        {formatDateDisplay(project?.end)}
                      </p>
                    </div>
                    {canEditProjectDates && (
                      <button 
                        onClick={handleOpenEditProjectEndDate}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg font-bold text-sm flex items-center gap-1.5 hover:bg-blue-100 transition-colors whitespace-nowrap"
                      >
                        <Pencil size={14} /> Modificar
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Sprints Section - always visible, actions gated */}
            <div
              id="config-sprints-section"
              className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 flex flex-col h-[560px] max-h-[600px] overflow-hidden"
            >
              <h3 className="text-xl font-bold flex items-center gap-2 mb-4 shrink-0">
                <LayoutList className="text-[#446E51]" /> Gestionar Sprints
              </h3>

              {!showSprintCreate ? (
                <div className="flex items-center gap-2 mb-4 shrink-0">
                  <div className="flex-1 relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={sprintSearch}
                      onChange={e => setSprintSearch(e.target.value)}
                      placeholder="Buscar sprint..."
                      className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#446E51] focus:border-transparent outline-none text-sm"
                    />
                  </div>
                  {canCreateSprint && (
                    <button
                      type="button"
                      onClick={() => { setShowSprintCreate(true); setEditingSprintId(null); }}
                      className="shrink-0 h-10 w-10 rounded-xl bg-[#446E51] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                      title="Nuevo sprint"
                    >
                      <Plus size={20} />
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2 mb-4 shrink-0">
                  <h4 className="font-bold text-sm text-slate-700">Agregar Nuevo Sprint</h4>
                  <button
                    type="button"
                    onClick={() => setShowSprintCreate(false)}
                    className="text-xs font-bold text-slate-500 hover:text-[#446E51] px-2 py-1 rounded-lg hover:bg-slate-50"
                  >
                    Volver a la lista
                  </button>
                </div>
              )}

              <div className="flex-1 min-h-0 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                {!showSprintCreate ? (
                  <div className="space-y-4">
                    {filteredSprints.map(s => (
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
                                <option value="completed">Finished</option>
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
                                <p className="text-xs text-slate-500"><span className="font-semibold">Inicio:</span> {s.startDate} — <span className="font-semibold">Fin:</span> {s.endDate}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-1 text-[10px] font-black uppercase text-white bg-[#446E51] rounded">
                                  {getStatusDisplay(s.status)}
                                </span>
                                {canCreateSprint && (
                                  <>
                                    <button onClick={() => startEditSprint(s)} className="p-1.5 text-slate-400 hover:text-[#446E51] hover:bg-green-50 rounded-lg transition-colors">
                                      <Pencil size={14} />
                                    </button>
                                    <button onClick={() => handleDeleteSprint(s.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                      <Trash2 size={14} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    {sprints.length === 0 && (
                      <p className="text-sm text-slate-400 italic">No hay sprints creados.</p>
                    )}
                    {sprints.length > 0 && filteredSprints.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-6">No se encontraron sprints.</p>
                    )}
                  </div>
                ) : (
                  canCreateSprint && (
                    <form onSubmit={handleAddSprint} className="space-y-4 pb-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Nombre del Sprint</label>
                        <input required value={sprintName} onChange={e => setSprintName(e.target.value)} placeholder="ej. Sprint 3" className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#446E51]" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Meta del Sprint</label>
                        <input value={sprintGoal} onChange={e => setSprintGoal(e.target.value)} placeholder="ej. Completar módulo de autenticación" className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#446E51]" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Capacidad de Story Points</label>
                        <input type="number" min="0" value={sprintCapacity} onChange={e => setSprintCapacity(e.target.value)} placeholder="ej. 40" className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#446E51]" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Fecha de inicio</label>
                          <input required type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#446E51] text-sm text-slate-600" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Fecha final</label>
                          <input required type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#446E51] text-sm text-slate-600" />
                        </div>
                      </div>
                      <button type="submit" className="w-full h-12 bg-[#446E51] text-white font-bold rounded-xl flex justify-center items-center gap-2 hover:opacity-90">
                        <Plus size={18} /> Crear Sprint
                      </button>
                    </form>
                  )
                )}
              </div>
            </div>

            {/* Members Section - always visible, actions gated */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
          <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
            <Users className="text-[#446E51]" /> Roles de Equipo
          </h3>
          <p className="text-sm text-slate-500 mb-4">Gestiona a los miembros asignados en general a este proyecto.</p>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={memberSearch}
                onChange={e => setMemberSearch(e.target.value)}
                placeholder="Buscar miembro..."
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#446E51] focus:border-transparent outline-none text-sm"
              />
            </div>
            <div className="relative">
              <button
                onClick={() => setShowRoleFilter(!showRoleFilter)}
                className={`h-10 px-3 rounded-xl border flex items-center gap-2 text-sm font-medium transition-colors ${memberRoleFilters.size > 0 ? 'border-[#446E51] bg-[#446E51]/10 text-[#446E51]' : 'border-gray-200 text-slate-500 hover:border-slate-300'}`}
              >
                <SlidersHorizontal size={15} />
                Rol{memberRoleFilters.size > 0 && <span className="text-[10px] bg-[#446E51] text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">{memberRoleFilters.size}</span>}
              </button>
              {showRoleFilter && (
                <div className="absolute right-0 top-12 bg-white border border-slate-100 rounded-xl shadow-lg z-20 min-w-[180px] py-2 animate-in fade-in zoom-in duration-150">
                  {roles.map(r => {
                    const active = memberRoleFilters.has(r.nombreRol);
                    return (
                      <button
                        key={r.idRol}
                        onClick={() => setMemberRoleFilters(prev => {
                          const next = new Set(prev);
                          if (next.has(r.nombreRol)) next.delete(r.nombreRol); else next.add(r.nombreRol);
                          return next;
                        })}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-50 transition-colors text-left"
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${active ? 'bg-[#446E51] border-[#446E51]' : 'border-slate-300'}`}>
                          {active && <Check size={10} className="text-white" />}
                        </div>
                        <span className={active ? 'text-[#446E51] font-semibold' : 'text-slate-600'}>{r.nombreRol}</span>
                      </button>
                    );
                  })}
                  {memberRoleFilters.size > 0 && (
                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={() => { setMemberRoleFilters(new Set()); setShowRoleFilter(false); }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-400 hover:text-red-500 transition-colors font-medium"
                      >
                        Limpiar filtros
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 max-h-[340px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
            {localMembers.map((m, origIdx) => ({ m, origIdx })).filter(({ m }) => {
              const q = memberSearch.toLowerCase();
              const matchesSearch = !q || m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q);
              const matchesRole = memberRoleFilters.size === 0 || memberRoleFilters.has(m.role);
              return matchesSearch && matchesRole;
            }).map(({ m, origIdx: idx }) => (
              <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                {editingMemberIdx === idx ? (
                  <div className="space-y-3">
                    <p className="font-bold text-slate-800 text-sm">{m.name}</p>
                    <select
                      value={editMemberRole}
                      onChange={e => setEditMemberRole(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#446E51] text-sm"
                    >
                      {roles.map(r => (
                        <option key={r.idRol} value={r.nombreRol}>{r.nombreRol}</option>
                      ))}
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
                      {canManageMembers && (
                        <>
                          <button onClick={() => startEditMember(idx)} className="p-1.5 text-slate-400 hover:text-[#446E51] hover:bg-green-50 rounded-lg transition-colors">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDeleteMember(idx)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {localMembers.filter(m => {
              const q = memberSearch.toLowerCase();
              return (!q || m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q)) && (memberRoleFilters.size === 0 || memberRoleFilters.has(m.role));
            }).length === 0 && (
              <p className="text-center text-sm text-slate-400 py-6">No se encontraron miembros.</p>
            )}
          </div>
            </div>
          </div>

          {/* Roles Management Section - always visible, actions gated */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 mt-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Shield className="text-[#446E51]" /> Gestionar Roles
                </h3>
                <p className="text-sm text-slate-500 mt-1">Crea roles personalizados con permisos específicos para tu equipo.</p>
              </div>
              {canManageMembers && (
                <button
                  onClick={() => { setEditingRole(null); setShowCreateRoleModal(true); }}
                  className="px-4 py-2.5 bg-[#446E51] text-white font-bold rounded-xl flex items-center gap-2 hover:opacity-90 transition-opacity text-sm"
                >
                  <Plus size={16} /> Nuevo Rol
                </button>
              )}
            </div>

            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
              {roles.map(role => (
                <div key={role.idRol} className="border border-slate-100 rounded-xl overflow-hidden">
                  <div className="p-4 bg-slate-50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#446E51]/10 flex items-center justify-center">
                        <Shield size={16} className="text-[#446E51]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">{role.nombreRol}</h4>
                        <p className="text-xs text-slate-400">ID: {role.idRol}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleRoleExpand(role.idRol)}
                        className="p-1.5 text-slate-400 hover:text-[#446E51] hover:bg-green-50 rounded-lg transition-colors"
                        title="Ver permisos"
                      >
                        <Eye size={14} />
                      </button>
                      {canManageMembers && (
                        <>
                          <button
                            onClick={() => { setEditingRole(role); setShowCreateRoleModal(true); }}
                            className="p-1.5 text-slate-400 hover:text-[#446E51] hover:bg-green-50 rounded-lg transition-colors"
                            title="Editar rol"
                          >
                            <Pencil size={14} />
                          </button>
                          {role.idRol > 3 && (
                            <button
                              onClick={() => handleDeleteRole(role.idRol)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar rol"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Expanded permissions */}
                  {expandedRoleId === role.idRol && (
                    <div className="px-4 pb-4 pt-2 bg-white border-t border-slate-100">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Permisos asignados</p>
                      {rolePermisos[role.idRol] && rolePermisos[role.idRol].length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {rolePermisos[role.idRol].map(p => (
                            <span
                              key={p.idPermiso}
                              className="px-3 py-1.5 text-xs font-semibold bg-[#446E51]/10 text-[#446E51] rounded-lg"
                            >
                              {p.descripcion || p.nombrePermiso}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400 italic">Sin permisos asignados</p>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {roles.length === 0 && (
                <p className="text-sm text-slate-400 italic text-center py-4">No hay roles definidos.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Role Modal */}
      <CreateRoleModal
        isOpen={showCreateRoleModal}
        onClose={() => { setShowCreateRoleModal(false); setEditingRole(null); }}
        onRoleCreated={async () => {
          await loadRoles();
          setRolePermisos({});
          setExpandedRoleId(null);
          await refreshPermissionsForProject(projectId);
        }}
        editRole={editingRole}
        projectId={projectId}
      />
    </div>
  );
};

export default ProjectConfigView;
