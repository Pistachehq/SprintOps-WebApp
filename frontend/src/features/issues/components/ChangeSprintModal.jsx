import React, { useState } from 'react';
import { AnimatedPopup } from '../../../components/PopupPortal';
import { formatLong, nextSprintWindow } from '../../../domain/scheduleDates';

const ChangeSprintModal = ({
  open,
  issue,
  sprints,
  currentSprintId,
  project,
  canCreateSprint,
  onClose,
  onConfirm,
  onCreateSprint,
}) => {
  const [selectedId, setSelectedId] = useState(null);
  const [endDate, setEndDate] = useState('');
  const [datePending, setDatePending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sprintName, setSprintName] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [createdSprint, setCreatedSprint] = useState(null);
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setSelectedId(null);
      setEndDate('');
      setDatePending(false);
      setCreating(false);
      setSprintName('');
      setNewEnd('');
      setError('');
      setBusy(false);
      setCreatedSprint(null);
    }
  }

  const others = (sprints || []).filter((sprint) => String(sprint.id) !== String(currentSprintId));
  const choices = createdSprint && !others.some((sprint) => String(sprint.id) === String(createdSprint.id))
    ? [...others, createdSprint]
    : others;
  const selected = choices.find((sprint) => String(sprint.id) === String(selectedId)) || null;
  const windowForNew = nextSprintWindow(project, sprints);

  const reset = () => {
    setSelectedId(null);
    setEndDate('');
    setDatePending(false);
    setCreating(false);
    setSprintName('');
    setNewEnd('');
    setError('');
    setBusy(false);
    setCreatedSprint(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const confirmMove = async () => {
    if (!selected) return;
    if (!datePending) {
      if (!endDate || (selected.startDate && endDate < selected.startDate) || (selected.endDate && endDate > selected.endDate)) {
        setError('Elige una fecha dentro de ese sprint, o marca Por determinar.');
        return;
      }
    }
    setBusy(true);
    setError('');
    try {
      await onConfirm({
        toSprintId: selected.id,
        endDate: datePending ? null : endDate,
      });
      reset();
    } catch (err) {
      setError(err?.message || 'No se pudo cambiar de sprint.');
      setBusy(false);
    }
  };

  const createSprint = async (event) => {
    event.preventDefault();
    if (windowForNew.blocked) {
      setError(windowForNew.blockedReason);
      return;
    }
    if (!sprintName.trim() || !newEnd || newEnd < windowForNew.startMin || newEnd > windowForNew.endMax) {
      setError('Indica el nombre y una fecha final dentro del proyecto.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const created = await onCreateSprint({
        name: sprintName.trim(),
        startDate: windowForNew.startMin,
        endDate: newEnd,
      });
      setCreating(false);
      setSprintName('');
      setNewEnd('');
      if (created?.id != null) {
        setCreatedSprint(created);
        setSelectedId(created.id);
      }
      setBusy(false);
    } catch (err) {
      setError(err?.message || 'No se pudo crear el sprint.');
      setBusy(false);
    }
  };

  return (
    <AnimatedPopup open={open}>
      <div className="popup-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
        <div className="popup-panel flex max-h-[calc(var(--app-h)*0.88)] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-lg font-black text-slate-900">Cambiar de sprint</h2>
            <p className="mt-1 text-sm text-slate-500">
              {issue?.title ? `“${issue.title}”` : 'Elige el sprint de destino y la fecha.'}
            </p>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
            {!selected && (
              <>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Sprint de destino</p>
                {choices.length === 0 && (
                  <p className="text-sm text-slate-500">Todavía no hay otro sprint en el proyecto.</p>
                )}
                <div className="space-y-2">
                  {choices.map((sprint) => (
                    <button
                      key={sprint.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(sprint.id);
                        setEndDate('');
                        setDatePending(false);
                        setError('');
                      }}
                      className="flex w-full flex-col items-start rounded-xl border border-slate-200 px-4 py-3 text-left transition-colors hover:border-[#67BFA1] hover:bg-[#67BFA1]/5"
                    >
                      <span className="text-sm font-black text-slate-800">{sprint.name || `Sprint ${sprint.id}`}</span>
                      <span className="mt-1 text-xs text-slate-500">
                        {formatLong(sprint.startDate)} – {formatLong(sprint.endDate)}
                      </span>
                    </button>
                  ))}
                </div>

                {canCreateSprint && (
                  <div className="rounded-xl border border-dashed border-slate-200 p-4">
                    {!creating ? (
                      <button
                        type="button"
                        onClick={() => {
                          setCreating(true);
                          setError('');
                        }}
                        className="text-sm font-bold text-[#3d7563]"
                      >
                        + Crear un sprint
                      </button>
                    ) : windowForNew.blocked ? (
                      <p className="text-sm font-medium text-amber-800">{windowForNew.blockedReason}</p>
                    ) : (
                      <form onSubmit={createSprint} className="space-y-3">
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Nuevo sprint</p>
                        <input
                          required
                          value={sprintName}
                          onChange={(e) => setSprintName(e.target.value)}
                          placeholder="Nombre"
                          className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm"
                        />
                        <p className="text-xs text-slate-500">
                          Empieza el {formatLong(windowForNew.startMin)}
                          {windowForNew.startLocked ? ', el día después del sprint anterior.' : '.'}
                        </p>
                        <input
                          required
                          type="date"
                          min={windowForNew.startMin}
                          max={windowForNew.endMax}
                          value={newEnd}
                          onChange={(e) => setNewEnd(e.target.value)}
                          className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm"
                        />
                        <button
                          type="submit"
                          disabled={busy}
                          className="h-10 w-full rounded-xl bg-[#67BFA1] text-sm font-bold text-white disabled:opacity-50"
                        >
                          Crear y elegir
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </>
            )}

            {selected && (
              <div className="space-y-4">
                <button type="button" onClick={() => setSelectedId(null)} className="text-xs font-bold text-[#3d7563]">
                  ← Elegir otro sprint
                </button>
                <div>
                  <p className="text-sm font-black text-slate-800">{selected.name || `Sprint ${selected.id}`}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Fechas del sprint: {formatLong(selected.startDate)} – {formatLong(selected.endDate)}
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">
                    Fecha fin tentativa
                  </label>
                  <input
                    type="date"
                    min={selected.startDate || undefined}
                    max={selected.endDate || undefined}
                    disabled={datePending}
                    value={datePending ? '' : endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-12 w-full rounded-xl border border-gray-200 px-3 text-sm disabled:opacity-50"
                  />
                  <label className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[#67BFA1]"
                      checked={datePending}
                      onChange={(e) => {
                        setDatePending(e.target.checked);
                        if (e.target.checked) setEndDate('');
                      }}
                    />
                    Por determinar
                  </label>
                </div>
              </div>
            )}

            {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          </div>

          <div className="flex gap-3 border-t border-slate-100 px-6 py-4">
            <button type="button" onClick={close} className="h-11 flex-1 rounded-xl bg-gray-100 font-bold text-slate-600">
              Cancelar
            </button>
            <button
              type="button"
              disabled={!selected || busy}
              onClick={confirmMove}
              className="h-11 flex-1 rounded-xl bg-[#67BFA1] font-bold text-white disabled:opacity-50"
            >
              {busy ? 'Moviendo...' : 'Mover'}
            </button>
          </div>
        </div>
      </div>
    </AnimatedPopup>
  );
};

export default ChangeSprintModal;
