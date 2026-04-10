import React, { useState } from 'react';
import { User, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/hooks/useAuth';

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/home');
    } catch (err) {
      setError(err.message || 'Usuario o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full">
      {/* Superposed User Icon Circle */}
      <div className="absolute -top-[120px] left-1/2 -translate-x-1/2 w-[80px] h-[80px] bg-[#446E51] rounded-full flex items-center justify-center shadow-lg border-4 border-white z-10">
        <User size={36} className="text-white" />
      </div>

      <form onSubmit={handleLogin} className="mt-8 space-y-[15px]">
        <div className="relative">
          <input
            type="text"
            placeholder="Usuario"
            className="w-full h-[50px] px-[16px] rounded-[10px] border border-[#dcdcdc] bg-[#f9f9f9] text-base focus:outline-none focus:ring-1 focus:ring-[#446E51] transition-all"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <User size={24} className="absolute right-[16px] top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        <div className="relative">
          <input
            type="password"
            placeholder="Contraseña"
            className="w-full h-[50px] px-[16px] rounded-[10px] border border-[#dcdcdc] bg-[#f9f9f9] text-base focus:outline-none focus:ring-1 focus:ring-[#446E51] transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Lock size={24} className="absolute right-[16px] top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        <div className="pt-[10px]">
          <button
            type="submit"
            disabled={loading}
            className="w-full h-[48px] bg-[#446E51] text-white rounded-[10px] font-bold text-base hover:opacity-90 transition-opacity mt-4 disabled:opacity-60"
          >
            {loading ? 'Iniciando...' : 'Iniciar Sesion'}
          </button>
        </div>

        {error && (
          <p className="text-red-500 text-[10px] text-center mt-2 font-bold uppercase tracking-wider">{error}</p>
        )}
      </form>

      <div className="mt-[10px] text-center">
        <p className="text-[12px] text-slate-500">
          Usuarios demo: <strong>axel, sm, po</strong> (Contraseña general: <strong>123</strong>)
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
