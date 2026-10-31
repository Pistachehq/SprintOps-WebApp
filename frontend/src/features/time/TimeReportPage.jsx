import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BackButton from '../../components/ui/BackButton';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { projectsRepository } from '../../data/repositories/projectsRepository';

const money = (value) => {
  if (value == null || value === '') return '—';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(value));
};

const hours = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0 h';
  return `${n.toLocaleString('es-MX', { maximumFractionDigits: 2 })} h`;
};

const TimeReportPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [tarifa, setTarifa] = useState('');
  const [margen, setMargen] = useState('20');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const data = await projectsRepository.getTiempo(projectId);
    setReport(data);
    setTarifa(data?.tarifaHora ?? '');
    setMargen(data?.margenUtilidad ?? '20');
  };

  useEffect(() => {
    let cancelled = false;
    projectsRepository.getTiempo(projectId)
      .then((data) => {
        if (cancelled) return;
        setReport(data);
        setTarifa(data?.tarifaHora ?? '');
        setMargen(data?.margenUtilidad ?? '20');
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'No se pudo cargar el reporte de tiempo');
      });
    return () => { cancelled = true; };
  }, [projectId]);

  const saveQuote = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await projectsRepository.updateCotizacion(projectId, {
        tarifaHora: tarifa === '' ? null : Number(tarifa),
        margenUtilidad: margen === '' ? null : Number(margen),
      });
      await load();
    } catch (err) {
      setError(err.message || 'No se pudo guardar la cotización');
    } finally {
      setSaving(false);
    }
  };

  if (!report && !error) {
    return <LoadingSpinner label="Cargando métricas de tiempo..." fullPage />;
  }

  const quote = report?.cotizacion;
  const gap = Number(report?.horasReales || 0) - Number(report?.horasEstimadas || 0);

  return (
    <div className="h-full overflow-y-auto bg-[#F0EFED] p-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="flex items-center gap-4">
          <BackButton to={`/project/${projectId}/sprints`} />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#67BFA1]">Modo gestión por tiempo</p>
            <h1 className="text-4xl font-black text-slate-900">Esfuerzo del proyecto</h1>
          </div>
        </div>

        {report?.modo !== 'tiempo' && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            Este proyecto está en modo ágil. Las horas solo se registran en proyectos de gestión por tiempo.
            <button type="button" onClick={() => navigate(`/project/${projectId}/sprints`)} className="ml-2 font-bold underline">
              Volver
            </button>
          </div>
        )}

        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Stat label="Horas estimadas" value={hours(report?.horasEstimadas)} />
          <Stat label="Horas reales" value={hours(report?.horasReales)} />
          <Stat
            label="Real vs estimado"
            value={`${gap > 0 ? '+' : ''}${hours(gap)}`}
          />
        </div>

        {report?.cotizacionHabilitada ? (
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">Recomendación de cotización</h2>
            <p className="mt-1 text-sm text-slate-500">
              Precio sugerido = horas reales × tarifa × (1 + margen). El rango va de 90% a 115% de ese precio.
            </p>
            <form onSubmit={saveQuote} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Tarifa por hora
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={tarifa}
                  onChange={(e) => setTarifa(e.target.value)}
                  className="mt-1 h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-semibold text-slate-800"
                />
              </label>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Margen de utilidad %
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={margen}
                  onChange={(e) => setMargen(e.target.value)}
                  className="mt-1 h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-semibold text-slate-800"
                />
              </label>
              <button
                type="submit"
                disabled={saving}
                className="h-12 rounded-xl bg-[#67BFA1] px-5 font-bold text-white hover:bg-[#52A98A] disabled:opacity-60"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </form>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Costo" value={money(quote?.costo)} />
              <Stat label="Precio sugerido" value={money(quote?.precioSugerido)} />
              <Stat label="Rango mínimo" value={money(quote?.precioMin)} />
              <Stat label="Rango máximo" value={money(quote?.precioMax)} />
            </div>
            {quote && quote.precioSugerido == null && (
              <p className="mt-3 text-sm text-slate-500">
                Falta tarifa por hora o todavía no hay horas registradas en las tareas.
              </p>
            )}
          </section>
        ) : report?.modo === 'tiempo' && (
          <p className="rounded-2xl border border-gray-100 bg-white px-5 py-4 text-sm text-slate-600">
            Las recomendaciones de cotización están apagadas. El proyecto sigue acumulando horas por persona, tarea y sprint.
          </p>
        )}

        <Table title="Por miembro" empty="Nadie ha registrado horas todavía." rows={report?.porMiembro || []} columns={[
          ['Nombre', (row) => row.name || 'Usuario'],
          ['Horas', (row) => hours(row.horas)],
        ]} />
        <Table title="Por sprint" empty="Sin horas asociadas a un sprint." rows={report?.porSprint || []} columns={[
          ['Sprint', (row) => row.sprintName],
          ['Horas reales', (row) => hours(row.horas)],
        ]} />
        <Table title="Por tarea" empty="Este proyecto todavía no tiene tareas." rows={report?.porTarea || []} columns={[
          ['Tarea', (row) => row.title],
          ['Sprint', (row) => row.sprintName],
          ['Estimadas', (row) => hours(row.horasEstimadas)],
          ['Reales', (row) => hours(row.horasReales)],
        ]} />
      </div>
    </div>
  );
};

const Stat = ({ label, value }) => (
  <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
    <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
  </div>
);

const Table = ({ title, rows, columns, empty }) => (
  <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
    <h2 className="border-b border-gray-100 px-5 py-4 text-lg font-black text-slate-900">{title}</h2>
    {rows.length === 0 ? (
      <p className="px-5 py-6 text-sm text-slate-500">{empty}</p>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <tr>
              {columns.map(([label]) => (
                <th key={label} className="px-5 py-3">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.issueId || row.userId || row.sprintName || index} className="border-t border-gray-100">
                {columns.map(([label, read]) => (
                  <td key={label} className="px-5 py-3 font-semibold text-slate-700">{read(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </section>
);

export default TimeReportPage;
