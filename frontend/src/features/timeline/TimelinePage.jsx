import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Trash2, Upload, Download } from 'lucide-react';
import BackButton from '../../components/ui/BackButton';
import { projectsRepository } from '../../data/repositories/projectsRepository';
import { sprintsRepository } from '../../data/repositories/sprintsRepository';
import { issuesRepository } from '../../data/repositories/issuesRepository';
import { timelineRepository } from '../../data/repositories/timelineRepository';
import { useAuth } from '../auth/hooks/useAuth';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { toast } from 'sonner';
import { ISSUE_TAG_COLORS, isAllowedIssueTagColor, normalizeIssueTagColor } from '../../domain/issueTagPalette';

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const DAYS_SHORT = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
const DAYS_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const COL_W = 40;
const ROW_H = 44;
const HEADER_H = 56;

function getDaysBetween(start, end) {
  const days = [];
  const d = new Date(start + 'T00:00:00');
  const last = new Date(end + 'T00:00:00');
  while (d <= last) { days.push(new Date(d)); d.setDate(d.getDate() + 1); }
  return days;
}

function dayIndex(days, dateStr) {
  if (!dateStr) return -1;
  const t = new Date(dateStr + 'T00:00:00').getTime();
  return days.findIndex(d => d.getTime() === t);
}

function diffDays(a, b) {
  if (!a || !b) return 0;
  return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000) + 1;
}

function PhotoModal({ projectId, fecha, userId, photoDatesSet, onPhotoChange, onClose, canUpload }) {
  const [photoUrl, setPhotoUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageBroken, setImageBroken] = useState(false);
  const fileInputRef = useRef(null);
  const dateStr = fecha.toISOString().split('T')[0];
  const hasPhoto = photoDatesSet.has(dateStr);

  useEffect(() => {
    setImageBroken(false);
    setPhotoUrl(hasPhoto ? `${timelineRepository.getPhotoUrl(projectId, dateStr)}?t=${Date.now()}` : null);
  }, [projectId, dateStr, hasPhoto]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (userId == null) {
      toast.error('Inicia sesión de nuevo para subir la foto.');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('fecha', dateStr);
      fd.append('userId', String(userId));
      await timelineRepository.uploadPhoto(projectId, fd);
      setPhotoUrl(`${timelineRepository.getPhotoUrl(projectId, dateStr)}?t=${Date.now()}`);
      setImageBroken(false);
      onPhotoChange();
      toast.success('Foto del daily guardada');
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'No se pudo subir la foto (revisa permisos o formato).');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async () => {
    if (userId == null) return;
    try {
      await timelineRepository.deletePhoto(projectId, dateStr, userId);
      setPhotoUrl(null);
      onPhotoChange();
      toast.success('Foto eliminada');
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'No se pudo eliminar la foto');
    }
  };

  const showImage = Boolean(photoUrl) && !imageBroken;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      <div className="relative z-10 w-[min(100vw-2rem,320px)] rounded-2xl bg-white p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-base font-bold text-gray-800">
              {DAYS_FULL[fecha.getDay()]}, {fecha.getDate()} {MONTHS_ES[fecha.getMonth()]}
            </p>
            <p className="mt-0.5 text-[11px] text-gray-400">Foto del Daily Meeting</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-gray-100" aria-label="Cerrar">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {!canUpload ? (
          showImage ? (
            <div className="relative overflow-hidden rounded-xl">
              <img
                src={photoUrl}
                alt="Daily meeting"
                className="h-44 w-full object-cover"
                onError={() => setImageBroken(true)}
              />
            </div>
          ) : hasPhoto && imageBroken ? (
            <div className="flex min-h-[7rem] flex-col items-center justify-center rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-6 text-center">
              <p className="text-[12px] font-semibold leading-snug text-amber-900">
                Había una foto registrada, pero no se pudo cargar. Intenta de nuevo más tarde.
              </p>
            </div>
          ) : (
            <div className="flex min-h-[7rem] flex-col items-center justify-center rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-6 text-center">
              <p className="text-[12px] font-semibold leading-snug text-gray-600">
                No se registró una fotografía para este daily meeting.
              </p>
            </div>
          )
        ) : showImage ? (
          <div className="group relative overflow-hidden rounded-xl">
            <img
              src={photoUrl}
              alt="Daily meeting"
              className="h-44 w-full object-cover"
              onError={() => {
                setImageBroken(true);
                setPhotoUrl(null);
              }}
            />
            <button
              type="button"
              onClick={handleDelete}
              className="absolute bottom-2 right-2 rounded-lg bg-red-500 p-1.5 opacity-0 shadow transition-opacity group-hover:opacity-100"
              aria-label="Eliminar foto"
            >
              <Trash2 size={14} className="text-white" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex h-44 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 transition-all hover:border-oracle-main hover:bg-green-50/30 disabled:opacity-60"
          >
            {uploading ? (
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-oracle-main border-t-transparent" />
            ) : (
              <>
                <Upload size={20} className="text-gray-300" />
                <span className="text-[11px] font-medium text-gray-400">Subir foto</span>
              </>
            )}
          </button>
        )}

        {canUpload && <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />}
      </div>
    </div>
  );
}

const TimelinePage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user, checkPermission, refreshPermissionsForProject } = useAuth();
  const canUploadDailyPhoto = checkPermission('canUploadDailyPhoto');

  const [project, setProject] = useState(null);
  const [issues, setIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [photoDates, setPhotoDates] = useState(new Set());
  const [hoveredRow, setHoveredRow] = useState(null);
  const [exportingDocx, setExportingDocx] = useState(false);
  const [viewH, setViewH] = useState(2000);
  const gridRef = useRef(null);
  const sidebarRef = useRef(null);
  const headerRef = useRef(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [pd, sd] = await Promise.all([
        projectsRepository.getById(projectId),
        sprintsRepository.getByProjectId(projectId),
      ]);
      setProject(pd);
      const all = []; const seen = new Set();
      for (const sp of (sd || [])) {
        const si = await issuesRepository.getBySprintId(sp.id).catch(() => []);
        (si || []).forEach(i => {
          if (!seen.has(i.id)) {
            seen.add(i.id);
            all.push({ ...i, sprintName: sp.name, sprintId: i.sprintId ?? sp.id });
          }
        });
      }
      setIssues(all.map((i, idx) => ({ ...i, displayIndex: idx + 1 })));
      const dt = await timelineRepository.getPhotoDates(projectId).catch(() => []);
      setPhotoDates(new Set(dt || []));
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (projectId) refreshPermissionsForProject(projectId);
  }, [projectId, refreshPermissionsForProject]);

  const days = useMemo(() => {
    const candidates = [];
    if (project?.start) candidates.push(new Date(project.start + 'T00:00:00'));
    if (project?.end) candidates.push(new Date(project.end + 'T00:00:00'));
    issues.forEach(i => {
      if (i.createdAt) candidates.push(new Date(i.createdAt + 'T00:00:00'));
      if (i.completedAt) candidates.push(new Date(i.completedAt + 'T00:00:00'));
    });
    const now = new Date(); now.setHours(0,0,0,0);
    candidates.push(now);
    if (candidates.length === 0) return [];
    const earliest = new Date(Math.min(...candidates.map(d => d.getTime())));
    const latest = new Date(Math.max(...candidates.map(d => d.getTime())));
    earliest.setDate(earliest.getDate() - 14);
    latest.setMonth(latest.getMonth() + 3);
    return getDaysBetween(earliest.toISOString().split('T')[0], latest.toISOString().split('T')[0]);
  }, [project, issues]);

  const today = useMemo(() => { const t = new Date(); t.setHours(0,0,0,0); return t; }, []);
  const todayIdx = useMemo(() => days.findIndex(d => d.getTime() === today.getTime()), [days, today]);

  const months = useMemo(() => {
    const r = []; let c = -1;
    days.forEach((d, i) => {
      const m = d.getMonth(), y = d.getFullYear();
      if (m !== c || (i > 0 && y !== days[i-1].getFullYear())) { r.push({ month: m, year: y, startIdx: i }); c = m; }
    });
    return r;
  }, [days]);

  const positions = useMemo(() => {
    const ts = today.toISOString().split('T')[0];
    return issues.map((issue, i) => {
      if (!issue.createdAt) return { issue, s: -1, e: -1, dur: 0, ci: i };
      const end = issue.completedAt || ts;
      const si = dayIndex(days, issue.createdAt), ei = dayIndex(days, end);
      if (si < 0 && ei < 0) return { issue, s: -1, e: -1, dur: 0, ci: i };
      const s = Math.max(0, si), e = Math.min(days.length - 1, ei < 0 ? days.length - 1 : ei);
      return { issue, s, e, dur: e - s + 1, ci: i };
    });
  }, [issues, days, today]);

  const syncScroll = useCallback((src) => {
    if (src === 'grid') {
      if (sidebarRef.current && gridRef.current) sidebarRef.current.scrollTop = gridRef.current.scrollTop;
      if (headerRef.current && gridRef.current) headerRef.current.scrollLeft = gridRef.current.scrollLeft;
    } else {
      if (gridRef.current && sidebarRef.current) gridRef.current.scrollTop = sidebarRef.current.scrollTop;
    }
  }, []);

  const scrollToToday = useCallback(() => {
    if (!gridRef.current || todayIdx < 0) return;
    gridRef.current.scrollTo({ left: Math.max(0, todayIdx * COL_W - gridRef.current.clientWidth / 2 + COL_W / 2), behavior: 'smooth' });
  }, [todayIdx]);

  useEffect(() => { if (!isLoading && days.length > 0) setTimeout(scrollToToday, 300); }, [isLoading, days, scrollToToday]);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const measure = () => setViewH(el.clientHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  });

  const refreshPhotoDates = async () => {
    const dt = await timelineRepository.getPhotoDates(projectId).catch(() => []);
    setPhotoDates(new Set(dt || []));
  };

  const handleExportDocx = async () => {
    if (!projectId) return;
    setExportingDocx(true);
    try {
      const blob = await projectsRepository.downloadIssuesDocx(projectId);
      const safe = (project?.name || 'proyecto').replace(/[^\w\s.-]/g, '_').replace(/\s+/g, ' ').trim() || 'proyecto';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safe}-Issues.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exportando .docx:', err);
    } finally {
      setExportingDocx(false);
    }
  };

  const openIssueDetail = useCallback((issue) => {
    const sid = issue?.sprintId;
    if (issue?.id == null || sid == null || sid === '') return;
    navigate(`/sprint/${sid}/planning/task/${issue.id}`);
  }, [navigate]);

  if (isLoading) return (
    <div className="flex min-h-0 flex-1 items-center justify-center bg-oracle-bg">
      <LoadingSpinner label="Cargando cronograma..." fullPage />
    </div>
  );

  if (!project || days.length === 0) return (
    <div className="flex min-h-0 flex-1 flex-col bg-oracle-bg">
      <div className="h-[72px] px-10 flex items-center"><BackButton to={`/project/${projectId}/sprints`} /></div>
      <div className="flex-1 flex items-center justify-center"><p className="text-gray-500">No se pudo cargar el cronograma del proyecto.</p></div>
    </div>
  );

  const gridW = days.length * COL_W;
  const gridH = Math.max(issues.length * ROW_H, viewH);
  const sidebarW = 300;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-oracle-bg">

      {/* Top bar */}
      <div className="h-[60px] px-6 flex items-center justify-between shrink-0 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-4">
          <BackButton to={`/project/${projectId}/sprints`} />
          <div>
            <h1 className="text-sm font-bold text-gray-800">{project.name}</h1>
            <p className="text-[11px] text-gray-400 font-medium">Cronograma del Proyecto</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleExportDocx}
          disabled={exportingDocx}
          className="flex items-center gap-2 text-xs font-semibold py-2 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:hover:bg-blue-600 transition-colors"
        >
          <Download size={14} />
          {exportingDocx ? 'Exportando…' : 'Exportar a .docx'}
        </button>
      </div>

      {/* Chart */}
      <div className="flex-1 flex overflow-hidden bg-white">

        {/* Sidebar */}
        <div className="shrink-0 flex flex-col border-r border-gray-100" style={{ width: sidebarW }}>
          {/* Sidebar header */}
          <div className="shrink-0 flex items-center px-4 border-b border-gray-100 bg-gray-50/80" style={{ height: HEADER_H }}>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Issues</span>
            <span className="ml-2 text-[10px] text-oracle-main bg-oracle-main/10 px-2 py-0.5 rounded-full font-bold">{issues.length}</span>
          </div>
          {/* Issue rows */}
          <div ref={sidebarRef} className="flex-1 overflow-y-auto overflow-x-hidden" onScroll={() => syncScroll('sidebar')} style={{ scrollbarWidth: 'thin' }}>
            <div style={{ height: gridH }}>
              {positions.map((p, idx) => {
                const fromTag =
                  p.issue.tagLabel && isAllowedIssueTagColor(p.issue.tagColor)
                    ? normalizeIssueTagColor(p.issue.tagColor)
                    : null;
                const color = fromTag ?? ISSUE_TAG_COLORS[p.ci % ISSUE_TAG_COLORS.length];
                const dur = p.issue.createdAt ? diffDays(p.issue.createdAt, p.issue.completedAt || today.toISOString().split('T')[0]) : 0;
                const done = p.issue.status === 'done';
                return (
                  <div key={p.issue.id}
                    className={`flex items-center px-4 gap-3 border-b border-gray-50 transition-colors cursor-default ${hoveredRow === idx ? 'bg-oracle-main/5' : ''}`}
                    style={{ height: ROW_H }}
                    onMouseEnter={() => setHoveredRow(idx)} onMouseLeave={() => setHoveredRow(null)}>
                    <div className="w-2.5 h-2.5 rounded shrink-0" style={{ background: color }} />
                    <span className="text-[11px] text-gray-400 font-bold shrink-0 w-7">#{p.issue.displayIndex || p.issue.id}</span>
                    <span className={`text-[12px] truncate flex-1 font-medium ${done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{p.issue.title}</span>
                    {dur > 0 && <span className="text-[10px] text-gray-400 font-medium shrink-0 tabular-nums">{dur} días</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Grid area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Column header */}
          <div className="shrink-0 border-b border-gray-100 overflow-hidden bg-gray-50/80" style={{ height: HEADER_H }}>
            <div ref={headerRef} className="h-full overflow-hidden" style={{ width: '100%' }}>
              <div style={{ width: gridW }} className="h-full">
                {/* Months */}
                <div className="flex h-6 items-end" style={{ width: gridW }}>
                  {months.map((m, mi) => {
                    const next = mi < months.length - 1 ? months[mi+1].startIdx : days.length;
                    return (
                      <div key={mi} className="pl-2 border-l border-gray-200 first:border-l-0" style={{ width: (next - m.startIdx) * COL_W }}>
                        <span className="text-[10px] font-bold text-gray-500">{MONTHS_ES[m.month]} {m.year}</span>
                      </div>
                    );
                  })}
                </div>
                {/* Days */}
                <div className="flex items-center" style={{ width: gridW, height: HEADER_H - 24 }}>
                  {days.map((date, idx) => {
                    const isToday = idx === todayIdx;
                    const isWe = date.getDay() === 0 || date.getDay() === 6;
                    const hasPhoto = photoDates.has(date.toISOString().split('T')[0]);
                    return (
                      <button key={idx} style={{ width: COL_W }}
                        className={`flex-none flex flex-col items-center justify-center relative h-full ${isWe ? 'text-gray-300' : 'text-gray-500'} hover:text-oracle-main transition-colors`}
                        onClick={() => { const ds = date.toISOString().split('T')[0]; setSelectedDay(prev => prev === ds ? null : ds); }}>
                        <span className={`text-[11px] font-bold leading-none w-6 h-6 flex items-center justify-center rounded-md ${isToday ? 'bg-oracle-main text-white' : ''}`}>
                          {date.getDate()}
                        </span>
                        <span className={`text-[8px] leading-none mt-0.5 ${isToday ? 'text-oracle-main font-bold' : ''}`}>{DAYS_SHORT[date.getDay()]}</span>
                        {hasPhoto && <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-oracle-main" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Grid body */}
          <div ref={gridRef} className="flex-1 overflow-auto" onScroll={() => syncScroll('grid')} style={{ scrollbarWidth: 'thin' }}>
            <div className="relative" style={{ width: gridW, height: gridH }}>

              {/* Row stripes */}
              {issues.map((_, idx) => (
                <div key={`r-${idx}`}
                  className={`absolute left-0 border-b transition-colors ${hoveredRow === idx ? 'bg-oracle-main/[0.04]' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} border-gray-50`}
                  style={{ top: idx * ROW_H, height: ROW_H, width: gridW }}
                  onMouseEnter={() => setHoveredRow(idx)} onMouseLeave={() => setHoveredRow(null)} />
              ))}

              {/* Weekend shading */}
              {days.map((date, idx) => {
                if (date.getDay() !== 0 && date.getDay() !== 6) return null;
                return <div key={`we-${idx}`} className="absolute top-0 pointer-events-none bg-gray-100/40" style={{ left: idx * COL_W, width: COL_W, height: gridH }} />;
              })}

              {/* Monday dividers */}
              {days.map((date, idx) => {
                if (date.getDay() !== 1) return null;
                return <div key={`ml-${idx}`} className="absolute top-0 pointer-events-none bg-gray-200/50" style={{ left: idx * COL_W, width: 1, height: gridH }} />;
              })}

              {/* Today line */}
              {todayIdx >= 0 && (
                <div className="absolute top-0 pointer-events-none z-20" style={{ left: todayIdx * COL_W + COL_W / 2 - 1, width: 2, height: gridH, background: '#446E51' }}>
                  <div className="absolute -top-1 -left-[3px] w-2 h-2 rounded-full bg-oracle-main" />
                </div>
              )}

              {/* Issue bars */}
              {positions.map((p, idx) => {
                if (p.s < 0) return null;
                const fromTag =
                  p.issue.tagLabel && isAllowedIssueTagColor(p.issue.tagColor)
                    ? normalizeIssueTagColor(p.issue.tagColor)
                    : null;
                const color = fromTag ?? ISSUE_TAG_COLORS[p.ci % ISSUE_TAG_COLORS.length];
                const left = p.s * COL_W + 2;
                const width = Math.max(p.dur * COL_W - 4, 14);
                const top = idx * ROW_H + 8;
                const h = ROW_H - 16;
                const done = p.issue.status === 'done';

                return (
                  <div
                    key={p.issue.id}
                    role="button"
                    tabIndex={0}
                    className="absolute rounded-md flex items-center overflow-hidden cursor-pointer transition-all duration-150 hover:shadow-md hover:brightness-105 group"
                    style={{ left, width, top, height: h, background: color, opacity: done ? 0.45 : 0.85, zIndex: 10 }}
                    onMouseEnter={() => setHoveredRow(idx)}
                    onMouseLeave={() => setHoveredRow(null)}
                    onClick={() => openIssueDetail(p.issue)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openIssueDetail(p.issue);
                      }
                    }}
                    title={`#${p.issue.displayIndex || p.issue.id} — ${p.issue.title} (${p.dur} días) · Clic para abrir`}
                  >
                    <span className="text-[10px] font-bold text-white px-2 whitespace-nowrap overflow-hidden text-ellipsis drop-shadow-sm">
                      {width > 80 ? p.issue.title : width > 40 ? `#${p.issue.displayIndex || p.issue.id}` : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Photo modal */}
      {selectedDay && (
        <PhotoModal
          projectId={projectId}
          fecha={new Date(selectedDay + 'T00:00:00')}
          userId={user?.id}
          photoDatesSet={photoDates}
          onPhotoChange={refreshPhotoDates}
          onClose={() => setSelectedDay(null)}
          canUpload={canUploadDailyPhoto}
        />
      )}
    </div>
  );
};

export default TimelinePage;
