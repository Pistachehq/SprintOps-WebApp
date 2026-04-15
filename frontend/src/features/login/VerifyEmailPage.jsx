import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import apiClient from '../../data/api/apiClient';

const VerifyEmailPage = () => {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Falta el token de verificación en el enlace.');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.post('/auth/verify-email', { token });
        if (!cancelled) {
          setStatus('ok');
          setMessage(res?.message || 'Correo verificado.');
        }
      } catch (e) {
        if (!cancelled) {
          setStatus('error');
          setMessage(e.message || 'No se pudo verificar el correo.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#212121] px-6 py-12 font-sans">
      <img
        src="/pistache-banner.png"
        alt="Pistache"
        className="h-14 w-auto mb-10 object-contain"
      />
      <div className="w-full max-w-md text-center">
        {status === 'loading' && (
          <p className="text-white text-lg">Verificando tu correo…</p>
        )}
        {status === 'ok' && (
          <p className="text-white text-lg mb-8">{message}</p>
        )}
        {status === 'error' && (
          <p className="text-red-300 text-base mb-8">{message}</p>
        )}
        <Link
          to="/login"
          className="inline-block bg-[#98D1C8] text-white font-bold uppercase tracking-wider text-sm px-8 py-4 rounded-xl hover:opacity-90 transition-opacity"
        >
          Ir a iniciar sesión
        </Link>
      </div>
      <p className="fixed bottom-6 right-8 text-white/80 text-xs">Pistache® 2026</p>
    </div>
  );
};

export default VerifyEmailPage;
