import { useNavigate, Link, useLocation } from 'react-router-dom';
import Avatar from './Avatar';
import SearchBar from './SearchBar';
import { useAuth } from '../features/auth/hooks/useAuth';

const Navbar = ({ onSearch }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/home' || location.pathname === '/projects';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <nav className="h-[70px] bg-[#312D2A] px-10 flex items-center sticky top-0 z-40 shadow-sm justify-between">
      <Link to="/home" className="flex items-center justify-center h-full w-[280px] overflow-hidden cursor-pointer">
        <img 
          src="/logo-SprintOps.png" 
          alt="Oracle SprintOps" 
          className="min-w-[350px] h-auto block mix-blend-lighten contrast-125"
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
              <p className="text-sm font-bold text-white">{user?.name || 'Usuario'}</p>
              <p className="text-[10px] text-gray-400 tracking-widest">{user?.email || ''}</p>
            </div>
            <Avatar name={user?.name} avatarUrl={user?.avatarUrl} className="border-2 border-white/20" />
          </button>

          {/* User Menu Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden transform scale-95 opacity-0 invisible group-hover:scale-100 group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <div className="p-4 border-b border-gray-50 bg-gray-50/50">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Ajustes</p>
            </div>
            <button 
              onClick={() => navigate('/profile')}
              className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2">
              Perfil
            </button>
            <button 
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 text-sm font-black text-oracle-red hover:bg-red-50 transition-colors flex items-center gap-2"
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
