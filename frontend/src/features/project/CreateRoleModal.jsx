import React, { useState, useEffect } from 'react';
import { X, Shield, Check, Plus, Zap, PlusCircle, Pencil, Users, BarChart3, Eye, Lock, Settings, CalendarCog, Camera } from 'lucide-react';
import { rolesRepository } from '../../data/repositories/rolesRepository';

const PERMISSION_ICONS = {
  canCreateSprint: Zap,
  canCreateIssue: PlusCircle,
  canEditIssue: Pencil,
  canManageMembers: Users,
  canViewMetrics: BarChart3,
  canViewOnlyOwnIssues: Lock,
  canViewAllIssues: Eye,
  canEditProjectDates: CalendarCog,
  canUploadDailyPhoto: Camera,
};

const PERMISSION_LABELS = {
  canCreateSprint: { label: 'Crear sprints' },
  canCreateIssue: { label: 'Crear issues' },
  canEditIssue: { label: 'Editar issues' },
  canManageMembers: { label: 'Gestionar miembros' },
  canViewMetrics: { label: 'Ver métricas del proyecto' },
  canViewOnlyOwnIssues: { label: 'Ver solo sus propios issues' },
  canViewAllIssues: { label: 'Ver issues de todo el equipo' },
  canEditProjectDates: { label: 'Modificar fechas del proyecto' },
  canUploadDailyPhoto: { label: 'Subir fotos del daily meeting (cronograma)' },
};

const CreateRoleModal = ({ isOpen, onClose, onRoleCreated, editRole = null, projectId = null }) => {
  const [roleName, setRoleName] = useState('');
  const [availablePermisos, setAvailablePermisos] = useState([]);
  const [selectedPermisoIds, setSelectedPermisoIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadPermisos();
      if (editRole) {
        setRoleName(editRole.nombreRol);
        loadRolePermisos(editRole.idRol);
      } else {
        setRoleName('');
        setSelectedPermisoIds(new Set());
      }
      setError('');
    }
  }, [isOpen, editRole]);

  const loadPermisos = async () => {
    setLoading(true);
    try {
      const permisos = await rolesRepository.getAllPermisos();
      setAvailablePermisos(permisos);
    } catch (err) {
      setError('Error al cargar permisos');
    } finally {
      setLoading(false);
    }
  };

  const loadRolePermisos = async (rolId) => {
    try {
      const permisos = await rolesRepository.getPermisos(rolId);
      setSelectedPermisoIds(new Set(permisos.map(p => p.idPermiso)));
    } catch (err) {
      console.error('Error loading role permissions:', err);
    }
  };

  const togglePermiso = (permisoId) => {
    setSelectedPermisoIds(prev => {
      const next = new Set(prev);
      if (next.has(permisoId)) {
        next.delete(permisoId);
      } else {
        next.add(permisoId);
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!roleName.trim()) {
      setError('El nombre del rol es requerido');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const permisoIds = Array.from(selectedPermisoIds);
      if (editRole) {
        await rolesRepository.update(editRole.idRol, { nombreRol: roleName.trim() });
        await rolesRepository.setPermisos(editRole.idRol, permisoIds);
      } else {
        await rolesRepository.createWithPermisos(roleName.trim(), permisoIds, projectId);
      }
      onRoleCreated?.();
      onClose();
    } catch (err) {
      setError(editRole ? 'Error al actualizar el rol' : 'Error al crear el rol');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Shield className="text-[#446E51]" size={22} />
            {editRole ? 'Editar Rol' : 'Crear Nuevo Rol'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Role Name */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Nombre del Rol
            </label>
            <input
              type="text"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="ej. Arquitecto de Software, QA Lead..."
              className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#446E51] focus:border-transparent outline-none text-sm"
              autoFocus
            />
          </div>

          {/* Permissions */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
              Permisos del Rol
            </label>
            {loading ? (
              <div className="text-center py-8 text-slate-400 text-sm">Cargando permisos...</div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {availablePermisos.map((permiso) => {
                  const isSelected = selectedPermisoIds.has(permiso.idPermiso);
                  const meta = PERMISSION_LABELS[permiso.nombrePermiso] || { label: permiso.nombrePermiso, icon: '⚙️' };

                  return (
                    <button
                      key={permiso.idPermiso}
                      type="button"
                      onClick={() => togglePermiso(permiso.idPermiso)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                        isSelected
                          ? 'bg-[#446E51]/10 border-[#446E51] text-slate-800'
                          : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-200'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'bg-[#446E51] border-[#446E51]' : 'border-slate-300'
                      }`}>
                        {isSelected && <Check size={12} className="text-white" />}
                      </div>
                      {(() => {
                        const IconComp = PERMISSION_ICONS[permiso.nombrePermiso] || Settings;
                        return <IconComp size={16} className={isSelected ? 'text-[#446E51]' : 'text-slate-400'} />;
                      })()}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${isSelected ? 'text-slate-800' : 'text-slate-600'}`}>
                          {meta.label}
                        </p>
                        {permiso.descripcionPermisos && (
                          <p className="text-xs text-slate-400 truncate">{permiso.descripcionPermisos}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <p className="text-sm text-red-500 font-medium">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 bg-gray-100 text-slate-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !roleName.trim()}
              className="flex-1 h-12 bg-[#446E51] text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? (
                'Guardando...'
              ) : editRole ? (
                <><Check size={18} /> Guardar Cambios</>
              ) : (
                <><Plus size={18} /> Crear Rol</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoleModal;
