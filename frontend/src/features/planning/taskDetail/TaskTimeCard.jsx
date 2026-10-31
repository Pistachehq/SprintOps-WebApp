import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { issuesRepository } from '../../../data/repositories/issuesRepository';
import { tiempoRepository } from '../../../data/repositories/tiempoRepository';

const inputClass = 'mt-1 h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#67BFA1]';

const TaskTimeCard = ({ task, userId, onEstimatedSaved }) => {
  const [logs, setLogs] = useState([]);
  const [estimadas, setEstimadas] = useState(task?.horasEstimadas ?? '');
  const [horas, setHoras] = useState('');
  const [nota, setNota] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadLogs = () => {
    if (!task?.id) return;
    tiempoRepository.logsByIssue(task.id).then(setLogs).catch(() => setLogs([]));
  };

  useEffect(() => {
    setEstimadas(task?.horasEstimadas ?? '');
    loadLogs();
  }, [task?.id, task?.horasEstimadas]);

  const saveEstimate = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await issuesRepository.update(task.id, {
        horasEstimadas: estimadas === '' ? null : Number(estimadas),
      });
      onEstimatedSaved?.();
    } catch (err) {
      setError(err.message || 'No se pudo guardar la estimación');
    } finally {
      setBusy(false);
    }
  };

  const addLog = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await tiempoRepository.registrar({
        issueId: task.id,
        userId,
        horas: Number(horas),
        nota,
      });
      setHoras('');
      setNota('');
      loadLogs();
      onEstimatedSaved?.();
    } catch (err) {
      setError(err.message || 'No se pudo registrar el tiempo');
    } finally {
      setBusy(false);
    }
  };

  const reales = logs.reduce((sum, log) => sum + Number(log.horas || 0), 0);
  const estimado = Number(task?.horasEstimadas || 0);
  const ratio = estimado > 0 ? Math.min(100, Math.round((reales / estimado) * 100)) : 0;

  return (
    <section className="mt-8 overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 px-8 py-6">
        <div>
          <h3 className="flex items-center gap-3 text-lg font-black text-slate-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#67BFA1]/15 text-[#3d7563]">
              <Clock size={18} />
            </span>
            Tiempo de la tarea
          </h3>
          <p className="mt-2 text-sm text-slate-500">Estimación y horas reales registradas.</p>
        </div>
        <div className="flex gap-3">
          <div className="min-w-[6.5rem] rounded-2xl bg-gray-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Estimado</p>
            <p className="text-xl font-black text-slate-900">{estimado.toLocaleString('es-MX')} h</p>
          </div>
          <div className="min-w-[6.5rem] rounded-2xl bg-[#67BFA1]/10 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#3d7563]">Real</p>
            <p className="text-xl font-black text-[#3d7563]">{reales.toLocaleString('es-MX', { maximumFractionDigits: 2 })} h</p>
          </div>
        </div>
      </div>

      {estimado > 0 && (
        <div className="px-8 pt-5">
          <div className="mb-1 flex justify-between text-[11px] font-bold text-slate-400">
            <span>Avance de horas</span>
            <span>{ratio}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-[#67BFA1]" style={{ width: `${ratio}%` }} />
          </div>
        </div>
      )}

      {error && <p className="px-8 pt-4 text-sm font-semibold text-red-600">{error}</p>}

      <div className="grid gap-8 px-8 py-6 lg:grid-cols-2">
        <form onSubmit={saveEstimate} className="rounded-2xl border border-gray-100 bg-gray-50/60 p-5">
          <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-500">Estimación</p>
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">
            Horas estimadas
            <input
              type="number"
              min="0"
              step="0.25"
              value={estimadas}
              onChange={(e) => setEstimadas(e.target.value)}
              className={inputClass}
            />
          </label>
          <button type="submit" disabled={busy} className="mt-4 h-11 w-full rounded-xl bg-slate-900 font-bold text-white disabled:opacity-60">
            Guardar estimación
          </button>
        </form>

        <form onSubmit={addLog} className="rounded-2xl border border-gray-100 bg-gray-50/60 p-5">
          <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-500">Registrar tiempo</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[7rem_1fr]">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Horas
              <input
                required
                type="number"
                min="0.25"
                max="24"
                step="0.25"
                value={horas}
                onChange={(e) => setHoras(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Nota
              <input
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Qué se hizo"
                className={`${inputClass} font-medium`}
              />
            </label>
          </div>
          <button type="submit" disabled={busy || !userId} className="mt-4 h-11 w-full rounded-xl bg-[#67BFA1] font-bold text-white disabled:opacity-60">
            Registrar
          </button>
        </form>
      </div>

      <div className="border-t border-gray-100 px-8 py-6">
        {logs.length === 0 ? (
          <p className="text-sm text-slate-400">Todavía no hay horas registradas en esta tarea.</p>
        ) : (
          <ul className="space-y-2">
            {logs.map((log) => (
              <li key={log.id} className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 text-sm">
                <span className="w-28 shrink-0 truncate font-bold text-slate-800">{log.userName || 'Usuario'}</span>
                <span className="min-w-0 flex-1 truncate text-slate-500">{log.nota || 'Sin nota'}</span>
                <span className="shrink-0 rounded-lg bg-white px-2 py-1 font-black text-[#3d7563]">{Number(log.horas).toLocaleString('es-MX')} h</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default TaskTimeCard;
