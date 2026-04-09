import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Layers, 
  Calendar, 
  CheckSquare, 
  BarChart2, 
  Users, 
  Settings,
  LogOut
} from 'lucide-react';
import { useAuth } from '../features/auth/hooks/useAuth';

const Sidebar = () => {
  const { logout } = useAuth();

  const menuItems = [
    { icon: Home, label: 'Inicio', path: '/home' },
    { icon: Layers, label: 'Proyectos', path: '/projects' },
    { icon: Calendar, label: 'Sprints', path: '/sprints' },
    { icon: CheckSquare, label: 'Tareas', path: '/tasks' },
    { icon: BarChart2, label: 'Métricas', path: '/metrics' },
    { icon: Users, label: 'Equipo', path: '/team' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
      <div className="p-6 flex-1">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Principal</p>
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                ${isActive 
                  ? 'bg-red-50 text-oracle-red font-bold' 
                  : 'text-slate-500 hover:bg-gray-50 hover:text-slate-900'}
              `}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-10 mb-6">Preferencias</p>
        <nav className="space-y-1">
          <NavLink
            to="/settings"
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
              ${isActive 
                ? 'bg-red-50 text-oracle-red font-bold' 
                : 'text-slate-500 hover:bg-gray-50 hover:text-slate-900'}
            `}
          >
            <Settings size={20} />
            <span>Configuración</span>
          </NavLink>
        </nav>
      </div>

      <div className="p-6 border-t border-gray-100">
        <button 
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full text-slate-500 hover:text-oracle-red hover:bg-red-50 rounded-xl transition-all duration-200"
        >
          <LogOut size={20} />
          <span className="font-bold">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
