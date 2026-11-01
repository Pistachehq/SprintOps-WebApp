import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ChevronDown, CircleUser, CreditCard, GitPullRequest, Palette, Settings } from 'lucide-react';
import Avatar from './Avatar';
import SearchBar from './SearchBar';
import { useAuth } from '../features/auth/hooks/useAuth';

const SETTINGS_ITEMS = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'perfil', label: 'Perfil', icon: CircleUser, to: '/profile' },
  { id: 'apariencia', label: 'Apariencia', icon: Palette, to: '/settings/apariencia' },
  { id: 'plan', label: 'Plan y uso', icon: CreditCard },
  { id: 'git', label: 'Git & PRs', icon: GitPullRequest },
];

const Navbar = ({ onSearch }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/home' || location.pathname === '/projects';

  const [settingsOpen, setSettingsOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const openSettingsItem = (item) => {
    if (!item.to) return;
    navigate(item.to);
  };
  
  return (
    <nav className="app-header h-[70px] px-10 flex items-center sticky top-0 z-40 shadow-sm justify-between">
      <Link to="/home" className="flex h-full shrink-0 items-center cursor-pointer py-1.5 pr-4">
        <img
          src="/logo-pistache.png"
          alt="Pistache"
          className="h-12 w-auto max-h-[58px] object-contain object-left"
        />
      </Link>

      {isHome && (
        <div className="hidden md:flex flex-1 justify-center px-4">
          <SearchBar onSearch={onSearch} />
        </div>
      )}

      <div className="flex items-center gap-6 min-w-[200px] justify-end">        
        <div className="relative group">
          <button className="flex items-center gap-3 transition-all hover:opacity-80">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold">{user?.name || 'Usuario'}</p>
              <p className="text-[10px] tracking-widest opacity-70">{user?.email || ''}</p>
            </div>
            <Avatar name={user?.name} avatarUrl={user?.avatarUrl} className="border-2 border-white/20" />
          </button>

          {/* User Menu Dropdown */}
          <div className="absolute right-0 mt-2 w-60 origin-top-right scale-95 rounded-xl border border-gray-100 bg-white py-1.5 opacity-0 shadow-xl invisible transition-all duration-200 group-hover:visible group-hover:scale-100 group-hover:opacity-100 z-50">
            <button
              type="button"
              onClick={() => setSettingsOpen((open) => !open)}
              className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm font-bold text-slate-800 hover:bg-slate-50"
              aria-expanded={settingsOpen}
            >
              Ajustes
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${settingsOpen ? 'rotate-180' : ''}`} />
            </button>
            {settingsOpen && (
              <div className="pb-1">
                {SETTINGS_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openSettingsItem(item)}
                      className="flex w-full items-center gap-2.5 py-2 pl-5 pr-3.5 text-left text-sm font-semibold text-slate-600 hover:bg-[#67BFA1]/10 hover:text-slate-800"
                    >
                      <Icon size={16} className="shrink-0 text-[#67BFA1]" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="mx-3 my-1 border-t border-gray-100" />
            <button
              type="button"
              onClick={handleLogout}
              className="w-full px-3.5 py-2.5 text-left text-sm font-black text-oracle-red hover:bg-red-50"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
