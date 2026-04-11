import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/hooks/useAuth';
import { usersRepository } from '../../data/repositories/usersRepository';
import { Camera, Save, FolderKanban, Pencil, CalendarDays, Shield, Hash } from 'lucide-react';
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

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
};

const ProfilePage = () => {
  const { user } = useAuth();
  const [username, setUsername] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [projects, setProjects] = useState([]);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.id) {
      usersRepository.getUserProjects(user.id).then(setProjects).catch(() => {});
    }
  }, [user?.id]);

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

  return (
    <div className="min-h-screen bg-[#F0EFED] p-8 lg:p-16">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <BackButton />
        </div>

        <h1 className="text-4xl font-black text-gray-800 mb-10">Mi Perfil</h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column — Profile Card */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-8">
              {/* Avatar + Name Row */}
              <div className="flex items-center gap-8 mb-8">
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
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && setEditing(false)}
                        className="text-2xl font-black text-gray-800 bg-transparent border-b-2 border-[#446E51] outline-none w-full"
                      />
                    ) : (
                      <h2 className="text-2xl font-black text-gray-800">{username}</h2>
                    )}
                    <button
                      onClick={() => setEditing(!editing)}
                      className="text-gray-400 hover:text-[#446E51] transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                  </div>
                  <p className="text-sm text-gray-400 font-medium">{user?.email}</p>
                </div>
              </div>

              {/* Avatar Picker */}
              {showAvatarPicker && (
                <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-sm font-bold text-gray-600 mb-4">Elige tu avatar</p>
                  <div className="grid grid-cols-6 gap-3">
                    {AVATAR_OPTIONS.map((url) => (
                      <button
                        key={url}
                        onClick={() => { setAvatarUrl(url); setShowAvatarPicker(false); }}
                        className={`w-14 h-14 rounded-full overflow-hidden border-3 transition-all hover:scale-110 ${avatarUrl === url ? 'border-[#446E51] ring-2 ring-[#446E51]/30 scale-110' : 'border-gray-200'}`}
                      >
                        <img src={url} alt="avatar option" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                  {avatarUrl && (
                    <button
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
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-[#446E51] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#3a5d45] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Save size={18} />
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              )}
            </div>

            {/* Stats Section */}
            <div className="bg-white rounded-2xl border border-gray-100 p-8">
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
                    <p className="text-sm font-black text-gray-800">{roleLabel[user?.role] || user?.role}</p>
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

          {/* Right Column — Projects */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 p-8">
              <h2 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-3">
                <FolderKanban size={22} className="text-[#446E51]" />
                Mis Proyectos
              </h2>
              {projects.length === 0 ? (
                <p className="text-gray-400 text-sm font-medium">No estás asignado a ningún proyecto.</p>
              ) : (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors">
                      <div>
                        <p className="font-bold text-gray-800">{project.name}</p>
                        <p className="text-xs text-gray-400 font-medium line-clamp-1">{project.description}</p>
                      </div>
                      <span className="shrink-0 text-[10px] font-black uppercase tracking-widest text-[#446E51] bg-[#446E51]/10 px-3 py-1 rounded-full">
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
