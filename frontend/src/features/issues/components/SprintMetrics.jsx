import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, X } from 'lucide-react';

/** Días en "Por hacer" (todo/blocked) sin completar → aviso por antigüedad desde creación. */
const STALE_TODO_DAYS = 5;
/** Días desde creación del issue en "En progreso" → aviso aproximado (no hay fecha de entrada a la columna). */
const STALE_WIP_DAYS = 10;

function daysSinceCalendarStart(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = String(dateStr).split('T')[0].split('-').map(Number);
  if (!y || !m || !d) {
    const t = new Date(dateStr);
    if (Number.isNaN(t.getTime())) return null;
    const start = new Date(t.getFullYear(), t.getMonth(), t.getDate());
    return (Date.now() - start.getTime()) / (1000 * 60 * 60 * 24);
  }
  const start = new Date(y, m - 1, d);
  return (Date.now() - start.getTime()) / (1000 * 60 * 60 * 24);
}

/**
 * Heurística con datos actuales (sin fecha de último movimiento en BD).
 * Una tarea entra en la lista si cumple al menos una condición.
 */
function getAtRiskEntries(issues) {
  const entries = [];
  for (const issue of issues) {
    if (issue.status === 'done') continue;
    const reasons = [];
    const age = daysSinceCalendarStart(issue.createdAt);

    if (issue.status === 'blocked') {
      reasons.push('Estado bloqueado');
    }
    if (!issue.assigneeIds?.length) {
      reasons.push('Sin persona asignada');
    }
    if ((issue.status === 'todo' || issue.status === 'blocked') && age != null && age >= STALE_TODO_DAYS) {
      reasons.push(`+${Math.floor(age)} días en por hacer`);
    }
    if (issue.status === 'in_progress' && age != null && age >= STALE_WIP_DAYS) {
      reasons.push(`+${Math.floor(age)} días desde creación en progreso`);
    }

    if (reasons.length > 0) {
      entries.push({ issue, reasons });
    }
  }
  return entries;
}

const SprintMetrics = ({ issues, issuesSentToNextSprint = 0, sprintId }) => {
  const navigate = useNavigate();
  const [showRiskModal, setShowRiskModal] = useState(false);

  const doneIssues = issues.filter(i => i.status === 'done');
  const totalPoints = issues.reduce((sum, i) => sum + (i.storyPoints || i.points || 0), 0);
  const donePoints = doneIssues.reduce((sum, i) => sum + (i.storyPoints || i.points || 0), 0);

  const atRiskEntries = useMemo(() => getAtRiskEntries(issues), [issues]);
  const atRiskCount = atRiskEntries.length;

  const openTask = (issueId) => {
    if (sprintId == null || issueId == null) return;
    setShowRiskModal(false);
    navigate(`/sprint/${sprintId}/planning/task/${issueId}`);
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#446E51]" />
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">
              Enviados al siguiente sprint
            </h4>
          </div>
          <p className="text-3xl font-black tabular-nums text-slate-800">{issuesSentToNextSprint}</p>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Tareas movidas desde este sprint al siguiente
          </p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">
              Tareas a revisar
            </h4>
          </div>
          <div className="flex items-end justify-between gap-2">
            <p
              className={`text-3xl font-black tabular-nums ${atRiskCount > 0 ? 'text-amber-700' : 'text-slate-800'}`}
            >
              {atRiskCount}
            </p>
            {atRiskCount > 0 && (
              <button
                type="button"
                onClick={() => setShowRiskModal(true)}
                className="shrink-0 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900 ring-1 ring-amber-200/80 transition hover:bg-amber-100"
              >
                Ver lista
              </button>
            )}
          </div>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Tareas que pueden estar en riesgo en este sprint
          </p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Progreso</h4>
          </div>
          <div className="mb-2">
            <div className="mb-1 flex justify-between text-xs font-bold text-slate-500">
              <span>
                {donePoints}/{totalPoints} pts
              </span>
              <span>{totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#446E51] transition-all"
                style={{ width: `${totalPoints > 0 ? (donePoints / totalPoints) * 100 : 0}%` }}
              />
            </div>
          </div>
          <p className="text-xs font-medium text-slate-400">
            {doneIssues.length} de {issues.length} tareas completadas
          </p>
        </div>
      </div>

      {showRiskModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="risk-modal-title"
        >
          <div className="max-h-[min(520px,85vh)] w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-amber-50 p-2 text-amber-700">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h2 id="risk-modal-title" className="text-lg font-black text-slate-900">
                    Tareas a revisar ({atRiskCount})
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Toca una fila para abrir el detalle. Las reglas son automáticas según estado,
                    asignación y antigüedad.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRiskModal(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>
            <ul className="max-h-[min(380px,60vh)] overflow-y-auto p-2">
              {atRiskEntries.map(({ issue, reasons }) => (
                <li key={issue.id} className="border-b border-slate-50 last:border-0">
                  <button
                    type="button"
                    onClick={() => openTask(issue.id)}
                    className="flex w-full flex-col items-start gap-2 rounded-xl px-3 py-3 text-left transition hover:bg-slate-50"
                  >
                    <div className="flex w-full flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400">
                        #{issue.displayIndex ?? issue.id}
                      </span>
                      <span className="min-w-0 flex-1 text-sm font-bold text-slate-800">{issue.title}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {reasons.map(r => (
                        <span
                          key={r}
                          className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-900 ring-1 ring-amber-100"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
};

export default SprintMetrics;
