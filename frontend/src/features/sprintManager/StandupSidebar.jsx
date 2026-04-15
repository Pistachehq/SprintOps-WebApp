import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Check,
  Loader2,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import apiClient from '../../data/api/apiClient';
import { useAuth } from '../auth/hooks/useAuth';

function localDateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function yesterdayKey() {
  const t = new Date();
  t.setDate(t.getDate() - 1);
  return localDateKey(t);
}

function formatSectionTitle(dateStr) {
  const today = localDateKey();
  const yest = yesterdayKey();
  const d = new Date(`${dateStr}T12:00:00`);
  const nice = d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  if (dateStr === today) return `Hoy, ${nice}`;
  if (dateStr === yest) return `Ayer, ${nice}`;
  const weekday = d.toLocaleDateString('es-MX', { weekday: 'long' });
  const cap = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return `${cap}, ${nice}`;
}

function formatSavedAt(iso) {
  if (!iso) return '';
  try {
    const t = new Date(iso);
    if (Number.isNaN(t.getTime())) return '';
    return t.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

const StandupSidebar = ({ isOpen, onClose, sprintId, userId, projectId }) => {
  const { checkPermission, refreshPermissionsForProject } = useAuth();
  const canViewMetrics = checkPermission('canViewMetrics');

  const [transitionOpen, setTransitionOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [reunionId, setReunionId] = useState(null);
  const [todayDate, setTodayDate] = useState('');
  const [formData, setFormData] = useState({ done: '', doing: '', blockers: '' });

  const [teamPanelOpen, setTeamPanelOpen] = useState(false);
  const [teamDays, setTeamDays] = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [expandedDates, setExpandedDates] = useState(() => new Set());
  const [detailEntry, setDetailEntry] = useState(null);
  const [detailDayLabel, setDetailDayLabel] = useState('');

  const loadDailyData = useCallback(async () => {
    if (!sprintId || !userId) return;
    setIsLoading(true);
    try {
      const data = await apiClient.post('/reuniones/daily', { sprintId: Number(sprintId), userId: Number(userId) });
      setReunionId(data.reunionId);
      setTodayDate(data.date);
      setFormData({
        done: data.done || '',
        doing: data.doing || '',
        blockers: data.blockers || '',
      });
    } catch (err) {
      console.error('Error loading daily meeting:', err);
    } finally {
      setIsLoading(false);
    }
  }, [sprintId, userId]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setTransitionOpen(true), 10);
      loadDailyData();
      if (projectId) refreshPermissionsForProject(projectId);
      return () => clearTimeout(timer);
    }
    setTransitionOpen(false);
    setTeamPanelOpen(false);
    setDetailEntry(null);
  }, [isOpen, projectId, loadDailyData, refreshPermissionsForProject]);

  const loadTeamDailies = useCallback(async () => {
    if (!sprintId) return;
    setTeamLoading(true);
    try {
      const days = await apiClient.get(`/reuniones/daily/team/${Number(sprintId)}`);
      const list = Array.isArray(days) ? days : [];
      setTeamDays(list);
      const today = localDateKey();
      const hasToday = list.some((d) => d.date === today);
      if (hasToday) {
        setExpandedDates(new Set([today]));
      } else if (list.length > 0) {
        setExpandedDates(new Set([list[0].date]));
      } else {
        setExpandedDates(new Set());
      }
    } catch (err) {
      console.error('Error loading team dailies:', err);
      setTeamDays([]);
    } finally {
      setTeamLoading(false);
    }
  }, [sprintId]);

  useEffect(() => {
    if (teamPanelOpen && sprintId) loadTeamDailies();
  }, [teamPanelOpen, sprintId, loadTeamDailies]);

  const toggleDate = (dateStr) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr);
      else next.add(dateStr);
      return next;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!reunionId || !userId) return;
    setIsSaving(true);
    try {
      await apiClient.post('/reuniones/daily/save', {
        reunionId,
        userId: Number(userId),
        done: formData.done,
        doing: formData.doing,
        blockers: formData.blockers,
      });
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error saving daily meeting:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const openTeamPanel = () => {
    setTeamPanelOpen(true);
  };

  const closeTeamPanel = () => {
    setTeamPanelOpen(false);
    setDetailEntry(null);
  };

  const openDetail = (entry, dateStr) => {
    setDetailEntry(entry);
    setDetailDayLabel(formatSectionTitle(dateStr));
  };

  if (!isOpen && !transitionOpen) return null;

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/20 transition-opacity duration-300 ${
          transitionOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-[400px] transform flex-col bg-white p-10 shadow-2xl transition-transform duration-300 ease-in-out ${
          transitionOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="relative mb-3 flex min-h-0 flex-1 flex-col">
          {/* Team dailies overlay */}
          {teamPanelOpen && (
            <div className="absolute inset-0 z-[55] flex flex-col bg-white">
              <div className="mb-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeTeamPanel}
                  className="rounded-full p-2 transition-colors hover:bg-gray-100"
                  aria-label="Volver"
                >
                  <ArrowLeft size={22} className="text-gray-600" />
                </button>
                <h2 className="text-lg font-black tracking-tight text-gray-800">
                  Historial de Daily Meetings del Equipo
                </h2>
              </div>

              {teamLoading ? (
                <div className="flex flex-1 flex-col items-center justify-center py-12">
                  <Loader2 size={28} className="mb-3 animate-spin text-[#446E51]" />
                  <p className="text-sm font-medium text-gray-400">Cargando registros…</p>
                </div>
              ) : teamDays.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-10 text-center">
                  <p className="text-sm font-semibold text-gray-600">
                    Aún no hay daily meetings del equipo en la vigencia de este sprint (entre su fecha de inicio y
                    fin).
                  </p>
                </div>
              ) : (
                <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                  {teamDays.map((day) => {
                    const open = expandedDates.has(day.date);
                    const entries = day.entries || [];
                    return (
                      <div key={day.date} className="overflow-hidden rounded-xl border border-gray-100">
                        <button
                          type="button"
                          onClick={() => toggleDate(day.date)}
                          className="flex w-full items-center justify-between gap-2 bg-white px-3 py-3 text-left transition-colors hover:bg-gray-50"
                        >
                          <span className="text-[13px] font-black text-[#446E51]">
                            {formatSectionTitle(day.date)}
                          </span>
                          {open ? (
                            <ChevronDown size={18} className="shrink-0 text-gray-400" />
                          ) : (
                            <ChevronRight size={18} className="shrink-0 text-gray-400" />
                          )}
                        </button>
                        {open && (
                          <div className="border-t border-gray-100 bg-gray-50/50">
                            {entries.map((en) => {
                              const time = formatSavedAt(en.savedAt);
                              return (
                                <button
                                  key={`${day.date}-${en.userId}`}
                                  type="button"
                                  onClick={() => openDetail(en, day.date)}
                                  className="flex w-full items-start justify-between gap-3 border-b border-gray-100 px-3 py-3 text-left last:border-b-0 hover:bg-white"
                                >
                                  <span className="text-[13px] font-bold text-gray-800">{en.userName || 'Usuario'}</span>
                                  <span className="max-w-[55%] shrink-0 text-right text-[11px] font-medium text-gray-500">
                                    Rol: {en.roleLabel || '—'}
                                    {time ? ` · ${time}` : ''}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Main daily form */}
          {!teamPanelOpen && (
            <>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-2xl font-black tracking-tight text-gray-800">Daily Meeting</h2>
                <div className="flex shrink-0 items-center gap-1">
                  {canViewMetrics && (
                    <button
                      type="button"
                      onClick={openTeamPanel}
                      className="rounded-full p-2 transition-colors hover:bg-gray-100"
                      title="Historial de Daily Meetings del Equipo"
                      aria-label="Historial de Daily Meetings del Equipo"
                    >
                      <ClipboardList size={22} className="text-gray-500" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full p-2 transition-colors hover:bg-gray-100"
                    aria-label="Cerrar"
                  >
                    <X size={24} className="text-gray-400" />
                  </button>
                </div>
              </div>

              {todayDate && (
                <p className="mb-8 text-xs font-medium capitalize text-gray-400">{formatDate(todayDate)}</p>
              )}

              {isLoading ? (
                <div className="flex flex-1 items-center justify-center">
                  <div className="text-center">
                    <Loader2 size={32} className="mx-auto mb-3 animate-spin text-[#446E51]" />
                    <p className="text-sm font-medium text-gray-400">Cargando...</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSave} className="relative flex min-h-0 flex-1 flex-col space-y-8">
                  <div className="space-y-2">
                    <label className="text-sm font-bold uppercase tracking-widest text-gray-500">¿Qué hice?</label>
                    <textarea
                      className="h-32 w-full resize-none rounded-2xl border border-gray-100 bg-gray-50 p-4 text-gray-700 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#446E51]"
                      placeholder="Describe tus logros de ayer..."
                      value={formData.done}
                      onChange={(e) => setFormData({ ...formData, done: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold uppercase tracking-widest text-gray-500">¿Qué haré?</label>
                    <textarea
                      className="h-32 w-full resize-none rounded-2xl border border-gray-100 bg-gray-50 p-4 text-gray-700 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#446E51]"
                      placeholder="¿Cuáles son tus objetivos para hoy?"
                      value={formData.doing}
                      onChange={(e) => setFormData({ ...formData, doing: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold uppercase tracking-widest text-red-500">
                      ¿Qué impedimentos tengo?
                    </label>
                    <textarea
                      className="h-32 w-full resize-none rounded-2xl border border-red-100 bg-red-50/30 p-4 text-gray-700 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-400"
                      placeholder="¿Hay algo que te bloquee?"
                      value={formData.blockers}
                      onChange={(e) => setFormData({ ...formData, blockers: e.target.value })}
                    />
                  </div>

                  <button
                    type="submit"
                    className="mt-auto flex w-full items-center justify-center gap-2 rounded-2xl bg-[#446E51] py-4 text-lg font-black text-white shadow-lg shadow-green-100 transition-opacity hover:opacity-90 disabled:opacity-60"
                    disabled={showToast || isSaving}
                  >
                    {showToast ? (
                      <>
                        <Check size={20} /> Guardado
                      </>
                    ) : isSaving ? (
                      <>
                        <Loader2 size={20} className="animate-spin" /> Guardando...
                      </>
                    ) : (
                      'Guardar Daily Meeting'
                    )}
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        {/* Detail popup */}
        {detailEntry && (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            onClick={() => setDetailEntry(null)}
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
            <div
              className="relative z-10 max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#446E51]">{detailDayLabel}</p>
                  <h3 className="mt-1 text-lg font-black text-gray-900">{detailEntry.userName}</h3>
                  <p className="mt-0.5 text-xs font-medium text-gray-500">
                    Rol: {detailEntry.roleLabel}
                    {formatSavedAt(detailEntry.savedAt) ? ` · ${formatSavedAt(detailEntry.savedAt)}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailEntry(null)}
                  className="rounded-full p-1.5 hover:bg-gray-100"
                  aria-label="Cerrar"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
              <div className="space-y-4 border-t border-gray-100 pt-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">¿Qué hice?</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                    {detailEntry.done?.trim() || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">¿Qué haré?</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                    {detailEntry.doing?.trim() || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-red-500">Impedimentos</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                    {detailEntry.blockers?.trim() || '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div
          className={`pointer-events-none absolute left-1/2 top-8 z-[60] flex -translate-x-1/2 items-center gap-3 rounded-full bg-slate-900 px-6 py-3 text-white shadow-2xl transition-all duration-300 ${
            showToast ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
          }`}
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
            <Check size={14} className="text-white" />
          </div>
          <span className="text-sm font-bold">Daily Meeting guardado correctamente</span>
        </div>
      </div>
    </>
  );
};

export default StandupSidebar;
