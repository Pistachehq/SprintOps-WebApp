import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { issuesRepository } from '../../../data/repositories/issuesRepository';
import { tiempoRepository } from '../../../data/repositories/tiempoRepository';

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

  return (
    <section className="mt-8 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
      <h3 className="mb-1 flex items-center gap-2 text-lg font-black text-slate-900">
        <Clock size={18} className="text-[#67BFA1]" /> Tiempo de la tarea
      </h3>
      <p className="mb-6 text-sm text-slate-500">
        Estimado {Number(task?.horasEstimadas || 0).toLocaleString('es-MX')} h · Real {reales.toLocaleString('es-MX', { maximumFractionDigits: 2 })} h
      </p>

      {error && <p className="mb-4 text-sm font-semibold text-red-600">{error}</p>}

      <form onSubmit={saveEstimate} className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Horas estimadas
          <input
            type="number"
            min="0"
            step="0.25"
            value={estimadas}
            onChange={(e) => setEstimadas(e.target.value)}
            className="mt-1 h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-semibold text-slate-800 sm:w-40"
          />
        </label>
        <button type="submit" disabled={busy} className="h-12 rounded-xl bg-slate-900 px-5 font-bold text-white disabled:opacity-60">
          Guardar estimación
        </button>
      </form>

      <form onSubmit={addLog} className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-[8rem_1fr_auto] sm:items-end">
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
            className="mt-1 h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-semibold text-slate-800"
          />
        </label>
        <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Nota
          <input
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Qué se hizo"
            className="mt-1 h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-slate-800"
          />
        </label>
        <button type="submit" disabled={busy || !userId} className="h-12 rounded-xl bg-[#67BFA1] px-5 font-bold text-white disabled:opacity-60">
          Registrar
        </button>
      </form>

      {logs.length === 0 ? (
        <p className="text-sm text-slate-400">Todavía no hay horas registradas en esta tarea.</p>
      ) : (
        <ul className="space-y-2">
          {logs.map((log) => (
            <li key={log.id} className="flex items-baseline justify-between gap-3 rounded-xl bg-gray-50 px-4 py-3 text-sm">
              <span className="font-bold text-slate-800">{log.userName || 'Usuario'}</span>
              <span className="min-w-0 flex-1 truncate text-slate-500">{log.nota || 'Sin nota'}</span>
              <span className="shrink-0 font-black text-[#67BFA1]">{Number(log.horas).toLocaleString('es-MX')} h</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default TaskTimeCard;
