import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../auth/hooks/useAuth';
import { usersRepository } from '../../data/repositories/usersRepository';
import { issuesRepository } from '../../data/repositories/issuesRepository';
import { Camera, Save, FolderKanban, Pencil, CalendarDays, Shield, Hash, Check, X } from 'lucide-react';
import BackButton from '../../components/ui/BackButton';

const AVATAR_OPTIONS = [
  'https://api.dicebear.com/9.x/thumbs/svg?seed=Felix',
  'https://api.dicebear.com/9.x/thumbs/svg?seed=Aneka',
  'https://api.dicebear.com/9.x/thumbs/svg?seed=Milo',
  'https://api.dicebear.com/9.x/thumbs/svg?seed=Bubba',
  'https://api.dicebear.com/9.x/thumbs/svg?seed=Tigger',
  'https://api.dicebear.com/9.x/thumbs/svg?seed=Oliver',
  'https://api.dicebear.com/9.x/thumbs/svg?seed=Luna',
  'https://api.dicebear.com/9.x/thumbs/svg?seed=Bella',
  'https://api.dicebear.com/9.x/thumbs/svg?seed=Chloe',
  'https://api.dicebear.com/9.x/thumbs/svg?seed=Max',
  'https://api.dicebear.com/9.x/thumbs/svg?seed=Leo',
  'https://api.dicebear.com/9.x/thumbs/svg?seed=Zoe',
];

/** Altura típica del bloque “Elige tu avatar” (título + rejilla 2×6 + enlace); fallback si aún no se midió con el panel abierto. */
const AVATAR_PANEL_RESERVE_PX = 220;

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
};

/** Rol del miembro en un proyecto (texto API) → clave interna. */
const normalizeProjectRole = (roleStr) => {
  if (!roleStr || typeof roleStr !== 'string') return 'developer';
  const s = roleStr.toLowerCase().replace(/\s+/g, '');
  if (s.includes('productowner') || s === 'po' || s.includes('product')) return 'productOwner';
  if (s.includes('scrummaster') || s === 'sm' || s.includes('scrum')) return 'scrumMaster';
  return 'developer';
};

/** Desempate: mismo puntaje → Product Owner > Scrum Master > Developer. */
const ROLE_SCORE_ORDER = ['productOwner', 'scrumMaster', 'developer'];

const pickPrimaryRoleFromScores = (scores) => {
  let best = 'developer';
  let bestVal = -1;
  for (const key of ROLE_SCORE_ORDER) {
    const v = scores[key] ?? 0;
    if (v > bestVal) {
      bestVal = v;
      best = key;
    }
  }
  return best;
};

const ProfilePage = () => {
  const { user } = useAuth();
  const [username, setUsername] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [projects, setProjects] = useState([]);
  /** Rol inferido por proyectos + carga de issues; null = usar rol de la cuenta. */
  const [computedPrimaryRole, setComputedPrimaryRole] = useState(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const leftColumnRef = useRef(null);
  /** Altura real de la columna izquierda con el selector de avatares abierto (se fija al abrir y se reutiliza siempre en desktop). */
  const leftHeightWithPickerOpenRef = useRef(null);
  const [projectsMaxHeight, setProjectsMaxHeight] = useState(null);

  const measureLeftColumn = useCallback(() => {
    const el = leftColumnRef.current;
    if (!el) return;
    const h = el.offsetHeight;
    if (showAvatarPicker) {
      leftHeightWithPickerOpenRef.current = h;
    }
    const panelH =
      leftHeightWithPickerOpenRef.current != null
        ? leftHeightWithPickerOpenRef.current
        : h + AVATAR_PANEL_RESERVE_PX;
    setProjectsMaxHeight(panelH);
  }, [showAvatarPicker]);

  useEffect(() => {
    if (user?.id) {
      usersRepository.getUserProjects(user.id).then(setProjects).catch(() => {});
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || projects.length === 0) {
      setComputedPrimaryRole(null);
      return;
    }
    const uid = Number(user.id);
    let cancelled = false;
    const scores = { productOwner: 0, scrumMaster: 0, developer: 0 };

    (async () => {
      const parts = await Promise.all(
        projects.map(async (p) => {
          const roleKey = normalizeProjectRole(p.role);
          let assignedHere = 0;
          try {
            const issues = await issuesRepository.getByProjectId(p.id);
            assignedHere = (issues || []).filter((issue) =>
              Array.isArray(issue.assigneeIds) &&
              issue.assigneeIds.some((id) => Number(id) === uid)
            ).length;
          } catch {
            /* ignorar proyecto sin issues accesibles */
          }
          return { roleKey, assignedHere };
        })
      );
      if (cancelled) return;
      parts.forEach(({ roleKey, assignedHere }) => {
        scores[roleKey] += 1 + assignedHere;
      });
      setComputedPrimaryRole(pickPrimaryRoleFromScores(scores));
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, projects]);

  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onMq = () => setIsDesktop(mq.matches);
    onMq();
    mq.addEventListener('change', onMq);
    return () => mq.removeEventListener('change', onMq);
  }, []);

  useEffect(() => {
    const el = leftColumnRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    measureLeftColumn();
    const ro = new ResizeObserver(() => measureLeftColumn());
    ro.observe(el);
    window.addEventListener('resize', measureLeftColumn);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measureLeftColumn);
    };
  }, [measureLeftColumn, showAvatarPicker]);

  const handleSave = async () => {
    if (!username.trim()) return;
    setSaving(true);
    try {
      const updated = await usersRepository.update(user.id, { name: username, avatarUrl });
      const authData = { ...user, name: updated.name, avatarUrl: updated.avatarUrl };
      localStorage.setItem('auth_user', JSON.stringify(authData));
      window.location.reload();
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : '??';
  const hasChanges = username !== user?.name || avatarUrl !== (user?.avatarUrl || '');

  const roleLabel = {
    developer: 'Developer',
    scrumMaster: 'Scrum Master',
    productOwner: 'Product Owner',
  };

  const primaryRoleKey = computedPrimaryRole ?? user?.role ?? 'developer';
  const primaryRoleLabel = roleLabel[primaryRoleKey] || primaryRoleKey;

  const projectsPanelStyle =
    isDesktop && projectsMaxHeight != null
      ? {
          height: projectsMaxHeight,
          maxHeight: projectsMaxHeight,
        }
      : undefined;

  return (
    <div className="flex min-h-0 flex-col bg-[#F0EFED] px-5 pb-8 pt-8 sm:px-6 sm:pt-10 lg:px-10 lg:pb-10 lg:pt-10">
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col">
        <div className="mb-5 flex shrink-0 items-center gap-3 sm:mb-6 sm:gap-4">
          <BackButton />
          <h1 className="text-3xl font-black text-gray-800 sm:text-4xl">Mi Perfil</h1>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-5 lg:items-start lg:gap-8">
          {/* Left Column — define altura de referencia para el panel de proyectos (desktop) */}
          <div ref={leftColumnRef} className="flex min-h-0 flex-col gap-6 lg:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-100 p-8 flex flex-col min-h-0 shadow-sm">
              {/* Avatar + Name Row */}
              <div className="flex items-center gap-8 mb-6 shrink-0">
                <div className="relative shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-28 h-28 rounded-full object-cover border-4 border-gray-100" />
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-oracle-red text-white flex items-center justify-center text-4xl font-bold border-4 border-gray-100">
                      {initials}
                    </div>
                  )}
                  <button
                    onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                    className="absolute bottom-0 right-0 w-9 h-9 bg-[#446E51] text-white rounded-full flex items-center justify-center hover:bg-[#3a5d45] transition-colors shadow-md"
                  >
                    <Camera size={15} />
                  </button>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    {editing ? (
                      <>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && setEditing(false)}
                          className="text-2xl font-black text-gray-800 bg-transparent border-b-2 border-[#446E51] outline-none flex-1"
                        />
                        <button
                          onClick={() => setEditing(false)}
                          className="w-8 h-8 rounded-full bg-[#446E51]/10 text-[#446E51] flex items-center justify-center hover:bg-[#446E51]/20 transition-colors"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => { setUsername(user?.name || ''); setEditing(false); }}
                          className="w-8 h-8 rounded-full bg-red-50 text-oracle-red flex items-center justify-center hover:bg-red-100 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <h2 className="text-2xl font-black text-gray-800">{username}</h2>
                        <button
                          onClick={() => setEditing(true)}
                          className="text-gray-400 hover:text-[#446E51] transition-colors"
                        >
                          <Pencil size={16} />
                        </button>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 font-medium">{user?.email}</p>
                </div>
              </div>

              {showAvatarPicker && (
                <div className="mb-6 shrink-0 rounded-xl border border-gray-100 bg-gray-50 p-4 sm:p-5">
                  <p className="mb-3 text-sm font-bold text-gray-600">Elige tu avatar</p>
                  <div className="grid grid-cols-6 gap-2 sm:gap-3">
                    {AVATAR_OPTIONS.map((url) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => { setAvatarUrl(url); setShowAvatarPicker(false); }}
                        className={`h-12 w-12 rounded-full overflow-hidden border-2 transition-all hover:scale-105 sm:h-14 sm:w-14 ${avatarUrl === url ? 'border-[#446E51] ring-2 ring-[#446E51]/30 scale-105' : 'border-gray-200'}`}
                      >
                        <img src={url} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => { setAvatarUrl(''); setShowAvatarPicker(false); }}
                      className="mt-3 text-xs font-bold text-oracle-red hover:underline"
                    >
                      Quitar avatar (usar iniciales)
                    </button>
                  )}
                </div>
              )}

              {/* Save Button */}
              {hasChanges && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex shrink-0 items-center gap-2 bg-[#446E51] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#3a5d45] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Save size={18} />
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              )}
            </div>

            {/* Stats Section */}
            <div className="bg-white rounded-2xl border border-gray-100 p-8 shrink-0 shadow-sm">
              <div className="grid grid-cols-3 gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#446E51]/10 flex items-center justify-center">
                    <CalendarDays size={20} className="text-[#446E51]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Miembro desde</p>
                    <p className="text-sm font-black text-gray-800">{formatDate(user?.fechaRegistro)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#446E51]/10 flex items-center justify-center">
                    <Shield size={20} className="text-[#446E51]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rol principal</p>
                    <p className="text-sm font-black text-gray-800">{primaryRoleLabel}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#446E51]/10 flex items-center justify-center">
                    <Hash size={20} className="text-[#446E51]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Proyectos</p>
                    <p className="text-sm font-black text-gray-800">{projects.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: en desktop altura máx. = columna izquierda; lista con scroll si hay muchos proyectos */}
          <div
            className="flex min-h-[240px] w-full lg:col-span-2 lg:min-h-0 lg:overflow-hidden"
            style={projectsPanelStyle}
          >
            <div className="flex h-full min-h-0 w-full min-w-0 flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8 lg:max-h-full">
              <h2 className="mb-4 flex shrink-0 items-center gap-3 text-lg font-black text-gray-800 lg:mb-5">
                <FolderKanban size={22} className="text-[#446E51]" />
                Mis Proyectos
              </h2>
              {projects.length === 0 ? (
                <p className="text-sm font-medium text-gray-400">No estás asignado a ningún proyecto.</p>
              ) : (
                <div
                  className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 -mr-0.5"
                  style={{ scrollbarWidth: 'thin' }}
                >
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-4 transition-colors hover:bg-gray-100"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-gray-800">{project.name}</p>
                        <p className="line-clamp-1 text-xs font-medium text-gray-400">{project.description}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#446E51]/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#446E51]">
                        {project.role || 'Developer'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
