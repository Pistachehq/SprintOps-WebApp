import React, { useEffect, useState, useMemo } from 'react';
import { Activity } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { sprintsRepository } from '../../data/repositories/sprintsRepository';
import { issuesRepository } from '../../data/repositories/issuesRepository';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const PLANNED_BAR = '#64748B';
const COMPLETED_BAR = '#446E51';

function sortSprints(list) {
  return [...(list || [])].sort((a, b) => {
    const da = a.startDate || '';
    const db = b.startDate || '';
    if (da !== db) return String(da).localeCompare(String(db));
    return (a.id || 0) - (b.id || 0);
  });
}

function groupIssuesBySprintId(issues) {
  const map = new Map();
  for (const issue of issues || []) {
    const sid = issue.sprintId != null ? String(issue.sprintId) : null;
    if (!sid) continue;
    if (!map.has(sid)) map.set(sid, []);
    map.get(sid).push(issue);
  }
  return map;
}

function sprintVelocityRow(sprint, issuesInSprint, currentSprintId) {
  const list = issuesInSprint || [];
  const planned = list.reduce((sum, i) => sum + (Number(i.storyPoints) || Number(i.points) || 0), 0);
  const completed = list
    .filter(i => i.status === 'done')
    .reduce((sum, i) => sum + (Number(i.storyPoints) || Number(i.points) || 0), 0);
  const isActual = String(sprint.id) === String(currentSprintId);
  const baseName = sprint.name?.trim() || `Sprint ${sprint.id}`;
  return {
    name: isActual ? `${baseName} (Actual)` : baseName,
    planned,
    completed,
    isCurrentSprint: isActual,
  };
}

/**
 * Tendencia: solo entre sprints ya “cerrados” en la vista (todos menos el actual).
 * Compara completados del penúltimo vs el último sprint cerrado.
 * Así el sprint en curso (a menudo con pocos puntos hechos aún) no marca “Baja” por artefacto.
 */
function computeTrend(rows) {
  const closed = rows.filter(r => !r.isCurrentSprint);
  if (closed.length < 2) {
    return { label: '—', className: 'text-slate-500', hint: 'Hace falta al menos 2 sprints anteriores al actual.' };
  }
  const a = closed[closed.length - 2].completed;
  const b = closed[closed.length - 1].completed;
  const diff = b - a;
  const epsilon = Math.max(1, Math.abs(a) * 0.05);
  if (Math.abs(diff) < epsilon) {
    return { label: 'Estable →', className: 'text-slate-700', hint: null };
  }
  if (diff > 0) {
    return { label: 'Alza ↗', className: 'text-[#446E51]', hint: null };
  }
  return { label: 'Baja ↘', className: 'text-red-600', hint: null };
}

/** Promedio de puntos completados: excluye el sprint actual si hay otros; si solo ves el actual, usa ese. */
function averageCompletedForDisplay(rows) {
  if (!rows.length) return null;
  const closed = rows.filter(r => !r.isCurrentSprint);
  const basis = closed.length > 0 ? closed : rows;
  const sum = basis.reduce((s, r) => s + r.completed, 0);
  return (sum / basis.length).toFixed(1);
}

const VelocityChart = ({ embedded = false, projectId = null, currentSprintId = null }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(Boolean(projectId));
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (projectId == null) {
      setRows([]);
      setLoading(false);
      setLoadError(null);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const [sprints, allIssues] = await Promise.all([
          sprintsRepository.getByProjectId(projectId),
          issuesRepository.getByProjectId(projectId),
        ]);
        if (cancelled) return;
        const sorted = sortSprints(sprints);
        const currentIdx = sorted.findIndex(s => String(s.id) === String(currentSprintId));
        // Solo sprints hasta el actual (orden cronológico): en Sprint 1 → 1 barra; en Sprint 2 → 1+2; etc.
        // No se muestran sprints futuros. Promedio y tendencia usan solo estas barras.
        const visibleSprints =
          currentIdx >= 0 ? sorted.slice(0, currentIdx + 1) : sorted;

        const bySprint = groupIssuesBySprintId(allIssues);
        const data = visibleSprints.map(s =>
          sprintVelocityRow(s, bySprint.get(String(s.id)), currentSprintId)
        );
        setRows(data);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setLoadError('No se pudieron cargar los datos del proyecto.');
          setRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId, currentSprintId]);

  const avgCompleted = useMemo(() => averageCompletedForDisplay(rows), [rows]);

  const trend = useMemo(() => computeTrend(rows), [rows]);

  const yMax = useMemo(() => {
    if (!rows.length) return 10;
    const m = Math.max(...rows.flatMap(r => [r.planned, r.completed]), 0);
    return Math.max(5, Math.ceil(m * 1.12));
  }, [rows]);

  /** Ancho mínimo por sprint para que las barras no se aplasten; activa scroll horizontal si hay muchos. */
  const chartInnerWidth = Math.max(400, rows.length * 88);

  const body = (
    <>
      {!embedded && (
        <h2 className="mb-6 flex items-center gap-3 text-lg font-black uppercase tracking-widest text-slate-900">
          <Activity size={20} className="text-oracle-red" />
          Velocidad Histórica
        </h2>
      )}

      {loadError && (
        <p className="mb-3 text-sm font-medium text-red-600" role="alert">
          {loadError}
        </p>
      )}

      {loading ? (
        <div
          className={`flex w-full items-center justify-center ${embedded ? 'min-h-[11rem]' : 'min-h-[12rem]'}`}
        >
          <LoadingSpinner label="Cargando velocidad…" />
        </div>
      ) : rows.length === 0 ? (
        <div
          className={`flex w-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm font-medium text-slate-500 ${embedded ? 'min-h-[11rem]' : 'min-h-[12rem]'}`}
        >
          {projectId == null
            ? 'Esperando datos del proyecto…'
            : 'No hay sprints en este proyecto todavía.'}
        </div>
      ) : (
        <>
          <div
            className={`w-full overflow-x-auto overflow-y-hidden ${embedded ? 'mb-3' : 'mb-4'} pb-1 [scrollbar-width:thin]`}
          >
            <div style={{ width: chartInnerWidth, minWidth: '100%', height: embedded ? 200 : 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={rows}
                  margin={{ top: 10, right: 12, left: 4, bottom: 8 }}
                  barCategoryGap="18%"
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#475569' }}
                    interval={0}
                    height={52}
                  />
                  <YAxis
                    domain={[0, yMax]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748B' }}
                    width={36}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value, name) => [`${value} pts`, name]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{
                      fontSize: '12px',
                      paddingTop: '12px',
                      color: '#334155',
                    }}
                    formatter={(value) => <span className="font-semibold text-slate-700">{value}</span>}
                  />
                  <Bar
                    dataKey="planned"
                    name="Planeados"
                    fill={PLANNED_BAR}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                  <Bar
                    dataKey="completed"
                    name="Completados"
                    fill={COMPLETED_BAR}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`grid grid-cols-2 gap-4 ${embedded ? 'mt-2' : 'mt-6'}`}>
            <div
              className="rounded-xl border border-slate-100 bg-slate-50 p-4"
              title="Media de puntos completados por sprint. Si hay sprint actual, no entra en la media (para no arrastrar el promedio a mitad de sprint)."
            >
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Promedio</p>
              <p className="text-xl font-black text-slate-900">
                {avgCompleted != null ? `${avgCompleted} pts` : '—'}
              </p>
            </div>
            <div
              className="rounded-xl border border-slate-100 bg-slate-50 p-4"
              title="Compara los puntos completados del último sprint ya terminado frente al anterior. El sprint actual no cuenta."
            >
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Tendencia</p>
              <p className={`text-xl font-black ${trend.className}`}>{trend.label}</p>
              {trend.hint ? (
                <p className="mt-1 text-[10px] leading-snug text-slate-400">{trend.hint}</p>
              ) : null}
            </div>
          </div>
        </>
      )}
    </>
  );

  if (embedded) {
    return <div className="space-y-2">{body}</div>;
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
      {body}
    </div>
  );
};

export default VelocityChart;
