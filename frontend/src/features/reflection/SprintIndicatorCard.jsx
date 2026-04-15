import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, Target } from 'lucide-react';
import { sprintsRepository } from '../../data/repositories/sprintsRepository';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

function sortSprints(list) {
  return [...(list || [])].sort((a, b) => {
    const da = a.startDate || '';
    const db = b.startDate || '';
    if (da !== db) return String(da).localeCompare(String(db));
    return (a.id || 0) - (b.id || 0);
  });
}

/**
 * Métricas persistidas en el sprint al enviar issues al panel "siguiente sprint" en Kanban.
 * Deuda = suma de SP registrada en esos envíos.
 * Desbalance = deuda vs capacidad del siguiente sprint (si existe).
 */
const SprintIndicatorCard = ({
  embedded = false,
  projectId = null,
  currentSprintId = null,
  /** Al abrir el modal de Reflexión se vuelve a pedir sprints (evita respuesta GET en caché). */
  refreshWhenOpen = false,
}) => {
  const [nextCapacity, setNextCapacity] = useState(null);
  const [nextSprintExists, setNextSprintExists] = useState(false);
  const [metaLoading, setMetaLoading] = useState(true);
  const [sentCount, setSentCount] = useState(0);
  const [sentPoints, setSentPoints] = useState(0);

  useEffect(() => {
    if (projectId == null || currentSprintId == null) {
      setNextCapacity(null);
      setNextSprintExists(false);
      setSentCount(0);
      setSentPoints(0);
      setMetaLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setMetaLoading(true);
      try {
        const sprints = await sprintsRepository.getByProjectId(projectId);
        if (cancelled) return;
        const sorted = sortSprints(sprints);
        const idx = sorted.findIndex(s => String(s.id) === String(currentSprintId));
        const current = idx >= 0 ? sorted[idx] : null;
        const next = idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null;
        setNextSprintExists(Boolean(next));
        const cap = next?.capacity;
        setNextCapacity(cap != null && cap !== '' ? Number(cap) : null);
        setSentCount(current?.issuesSentToNextSprint ?? 0);
        setSentPoints(current?.storyPointsSentToNextSprint ?? 0);
      } catch {
        if (!cancelled) {
          setNextSprintExists(false);
          setNextCapacity(null);
          setSentCount(0);
          setSentPoints(0);
        }
      } finally {
        if (!cancelled) setMetaLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId, currentSprintId, refreshWhenOpen]);

  const debtLoadPct = useMemo(() => {
    if (nextCapacity == null || nextCapacity <= 0 || sentPoints <= 0) return null;
    return Math.min(999, Math.round((sentPoints / nextCapacity) * 100));
  }, [nextCapacity, sentPoints]);

  const footer = useMemo(() => {
    if (sentCount === 0) {
      return {
        kind: 'ok',
        Icon: CheckCircle2,
        iconClass: 'text-[#446E51]',
        border: 'border-emerald-200',
        bg: 'bg-emerald-50',
        title: 'Sin deuda por envíos',
        subtitle:
          'Ningún issue fue enviado al siguiente sprint desde este tablero. La deuda solo cuenta esos traslados.',
        titleClass: 'text-emerald-900',
        subClass: 'text-emerald-800',
      };
    }
    if (metaLoading) {
      return {
        kind: 'wait',
        Icon: Info,
        iconClass: 'text-slate-400',
        border: 'border-slate-100',
        bg: 'bg-slate-50',
        title: 'Calculando desbalance…',
        subtitle: 'Leyendo sprints del proyecto y capacidad del siguiente.',
        titleClass: 'text-slate-700',
        subClass: 'text-slate-500',
      };
    }
    if (!nextSprintExists) {
      return {
        kind: 'info',
        Icon: Info,
        iconClass: 'text-slate-600',
        border: 'border-slate-200',
        bg: 'bg-slate-50',
        title: 'Sin sprint siguiente',
        subtitle:
          'Crea el próximo sprint en configuración del proyecto para comparar la deuda con su capacidad.',
        titleClass: 'text-slate-900',
        subClass: 'text-slate-600',
      };
    }
    if (debtLoadPct == null) {
      return {
        kind: 'warn',
        Icon: AlertTriangle,
        iconClass: 'text-amber-600',
        border: 'border-amber-200',
        bg: 'bg-amber-50',
        title: `Deuda: ${sentPoints} pts en ${sentCount} ${sentCount === 1 ? 'issue' : 'issues'}`,
        subtitle:
          'Define la capacidad (story points) del próximo sprint en configuración para ver el porcentaje de ocupación.',
        titleClass: 'text-amber-900',
        subClass: 'text-amber-800',
      };
    }
    if (debtLoadPct >= 100) {
      return {
        kind: 'bad',
        Icon: AlertTriangle,
        iconClass: 'text-red-600',
        border: 'border-red-200',
        bg: 'bg-red-50',
        title: `Deuda ~${debtLoadPct}% de la capacidad del próximo sprint`,
        subtitle:
          'Los puntos enviados al siguiente sprint superan (o igualan) la capacidad planificada. Conviene recortar alcance o subir capacidad.',
        titleClass: 'text-red-900',
        subClass: 'text-red-800',
      };
    }
    if (debtLoadPct >= 70) {
      return {
        kind: 'warn',
        Icon: AlertTriangle,
        iconClass: 'text-amber-600',
        border: 'border-amber-200',
        bg: 'bg-amber-50',
        title: `Desbalance ~${debtLoadPct}%`,
        subtitle:
          'Esa deuda consume gran parte del próximo sprint. Revisa prioridades y alcance.',
        titleClass: 'text-amber-900',
        subClass: 'text-amber-800',
      };
    }
    return {
      kind: 'okish',
      Icon: Info,
      iconClass: 'text-[#446E51]',
      border: 'border-emerald-200',
      bg: 'bg-emerald-50/80',
      title: `Carga ~${debtLoadPct}% sobre capacidad del próximo sprint`,
      subtitle: 'Hay margen, pero vigila que el equipo pueda asumir el arrastre.',
      titleClass: 'text-slate-900',
      subClass: 'text-slate-600',
    };
  }, [sentCount, sentPoints, nextSprintExists, metaLoading, debtLoadPct]);

  const showSpinner =
    currentSprintId != null && (projectId == null || metaLoading);

  const body = (
    <>
      {!embedded && (
        <h2 className="mb-6 flex items-center gap-3 text-lg font-black uppercase tracking-widest text-slate-900">
          <Target size={20} className="text-oracle-red" />
          Estimación de deuda
        </h2>
      )}

      {showSpinner ? (
        <div className="flex min-h-[8rem] items-center justify-center">
          <LoadingSpinner label="Cargando métricas del sprint…" />
        </div>
      ) : (
        <>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="min-w-0">
                <p className="text-sm font-bold leading-snug text-slate-700">
                  Issues no cumplidos en este sprint
                </p>
                <p className="mt-1 text-[11px] font-medium leading-snug text-slate-500">
                  Cantidad enviada al siguiente sprint desde el Kanban
                </p>
              </div>
              <span className="shrink-0 text-xl font-black tabular-nums text-slate-900">{sentCount}</span>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="min-w-0">
                <p className="text-sm font-bold leading-snug text-slate-700">Deuda</p>
                <p className="mt-1 text-[11px] font-medium leading-snug text-slate-500">
                  Suma de story points de esos mismos issues (lo que valían al moverlos)
                </p>
              </div>
              <span className="shrink-0 text-xl font-black tabular-nums text-[#446E51]">
                {sentPoints} pts
              </span>
            </div>
          </div>

          <div
            className={`mt-6 flex items-start gap-3 rounded-xl border p-4 ${footer.border} ${footer.bg}`}
          >
            <footer.Icon size={20} className={`mt-0.5 shrink-0 ${footer.iconClass}`} />
            <div>
              <p className={`text-sm font-black ${footer.titleClass}`}>{footer.title}</p>
              <p className={`mt-1 text-[10px] font-bold leading-snug ${footer.subClass}`}>
                {footer.subtitle}
              </p>
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

export default SprintIndicatorCard;
