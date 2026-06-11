import React, { useEffect, useState, useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { sprintsRepository } from '../../data/repositories/sprintsRepository';
import { projectsRepository } from '../../data/repositories/projectsRepository';
import { useAuth } from '../auth/hooks/useAuth';

/**
 * KPIs del sprint para un desarrollador (propios o de un integrante si hay permisos).
 */
const DeveloperKpisPanel = ({ sprintId }) => {
  const { user, checkPermission } = useAuth();
  const canViewMetrics = checkPermission('canViewMetrics');
  const canViewOthers = checkPermission('canViewAllIssues') || canViewMetrics;
  const [projectId, setProjectId] = useState(null);
  const [members, setMembers] = useState([]);
  const [selectedDevId, setSelectedDevId] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sprintId) return;
    sprintsRepository
      .getById(sprintId)
      .then((s) => setProjectId(s?.projectId ?? null))
      .catch(() => setProjectId(null));
  }, [sprintId]);

  useEffect(() => {
    if (!canViewOthers || !projectId) {
      setMembers([]);
      return;
    }
    projectsRepository
      .getMembers(projectId)
      .then((list) => setMembers(Array.isArray(list) ? list : []))
      .catch(() => setMembers([]));
  }, [canViewOthers, projectId]);

  useEffect(() => {
    setSelectedDevId(null);
  }, [sprintId]);

  useEffect(() => {
    if (!user?.id) return;
    if (selectedDevId == null) {
      setSelectedDevId(user.id);
    }
  }, [user?.id, selectedDevId]);

  const effectiveDevId = selectedDevId ?? user?.id;

  useEffect(() => {
    if (!canViewMetrics || !sprintId || !user?.id || effectiveDevId == null) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    sprintsRepository
      .getDeveloperKpis(sprintId, effectiveDevId, user.id)
      .then((data) => {
        if (!cancelled) setKpis(data);
      })
      .catch((e) => {
        if (!cancelled) {
          setKpis(null);
          setError(e?.message || 'No se pudieron cargar los KPIs');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [canViewMetrics, sprintId, effectiveDevId, user?.id]);

  const selectedName = useMemo(() => {
    if (!effectiveDevId) return '';
    const m = members.find((x) => x.userId === effectiveDevId);
    return m?.name || (effectiveDevId === user?.id ? 'Yo' : `Usuario ${effectiveDevId}`);
  }, [members, effectiveDevId, user?.id]);

  if (!user?.id || !canViewMetrics) return null;

  return (
    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 mb-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <BarChart3 size={16} className="text-oracle-main" />
          KPIs por desarrollador (sprint)
        </h3>
        {canViewOthers && members.length > 0 && (
          <select
            value={String(effectiveDevId)}
            onChange={(e) => setSelectedDevId(Number(e.target.value))}
            className="text-xs font-semibold text-gray-700 border border-gray-200 rounded-lg px-2 py-1.5 bg-gray-50 max-w-[12rem]"
          >
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.name || m.email || `Usuario ${m.userId}`}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading && <p className="text-xs text-gray-400 text-center py-3">Cargando…</p>}
      {error && <p className="text-xs text-red-600 text-center py-2">{error}</p>}

      {!loading && kpis && (
        <div className="space-y-3 text-sm">
          <p className="text-xs text-gray-500">
            Mostrando: <span className="font-semibold text-gray-700">{selectedName}</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-gray-50 p-3 border border-gray-100">
              <div className="text-[10px] font-bold text-gray-400 uppercase">Issues en sprint</div>
              <div className="text-xl font-black text-gray-800">{kpis.issuesAssignedInSprint}</div>
            </div>
            <div className="rounded-xl bg-[#67BFA1]/10 p-3 border border-[#67BFA1]/20">
              <div className="text-[10px] font-bold text-gray-500 uppercase">Completadas</div>
              <div className="text-xl font-black text-oracle-main">
                {Math.round((kpis.completionRateIssues || 0) * 100)}%
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-gray-50 p-3 border border-gray-100 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Por hacer</span>
              <span className="font-bold text-gray-700">{kpis.countTodo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">En progreso</span>
              <span className="font-bold text-gray-700">{kpis.countInProgress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Finalizado</span>
              <span className="font-bold text-gray-700">{kpis.countDone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Bloqueado</span>
              <span className="font-bold text-gray-700">{kpis.countBlocked}</span>
            </div>
          </div>
          <div className="rounded-xl bg-gray-50 p-3 border border-gray-100">
            <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Story points (atribuidos)</div>
            <div className="text-lg font-black text-gray-800">
              {(kpis.storyPointsAttributed ?? 0).toFixed(1)} SP
            </div>
            <div className="text-[10px] text-gray-400 mt-1">
              Reparto SP entre co-asignados, solo issues de este sprint.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeveloperKpisPanel;
