import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import apiClient from '../../data/api/apiClient';
import { useAuth } from '../auth/hooks/useAuth';
import LoginForm from './LoginForm';

const LoginPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { completeOAuthLogin } = useAuth();
  const oauthStarted = useRef(false);

  useEffect(() => {
    const err = searchParams.get('oauth_error');
    if (err) {
      if (err === 'not_configured') {
        toast.error('OAuth no está activo en el backend.', {
          description:
            'Define GOOGLE_CLIENT_* y/o GITHUB_CLIENT_* en variables de entorno o application-local.properties, reinicia Spring Boot y vuelve a intentar.',
          duration: 8000,
        });
      } else if (err === 'no_email') {
        toast.error('Google no devolvió un correo. Prueba otra cuenta o usa correo y contraseña.');
      } else {
        toast.error('No pudimos usar tu cuenta de Google. Prueba de nuevo o usa correo y contraseña.');
      }
      const next = new URLSearchParams(searchParams);
      next.delete('oauth_error');
      setSearchParams(next, { replace: true });
      return;
    }
    const code = searchParams.get('oauthCode');
    if (!code || oauthStarted.current) return;
    oauthStarted.current = true;
    (async () => {
      try {
        const dto = await apiClient.post('/auth/oauth-exchange', { code });
        await completeOAuthLogin(dto);
        const next = new URLSearchParams(searchParams);
        next.delete('oauthCode');
        setSearchParams(next, { replace: true });
        navigate('/home', { replace: true });
      } catch (e) {
        oauthStarted.current = false;
        toast.error(e.message || 'Error al completar el login con Google');
        const next = new URLSearchParams(searchParams);
        next.delete('oauthCode');
        setSearchParams(next, { replace: true });
      }
    })();
  }, [searchParams, setSearchParams, navigate, completeOAuthLogin]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F0EFED] font-sans">
      {/* Header Section */}
      <header className="w-full h-[80px] bg-[#312D2A] flex items-center justify-center shrink-0 shadow-sm px-4">
        <div className="flex items-center justify-center h-full w-[350px]">
          <img 
            src="/logo-SprintOps.png" 
            alt="Oracle SprintOps" 
            className="min-w-[450px] h-auto block mix-blend-lighten contrast-125"
          />
        </div>
      </header>

      {/* Main Content - Centered Card */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white w-[420px] rounded-[24px] p-[40px] shadow-md relative animate-in fade-in zoom-in duration-300">
          <LoginForm />
        </div>
      </main>
      
      {/* Invisible footer to balance the layout if needed */}
      <footer className="h-[20px] shrink-0" />
    </div>
  );
};

export default LoginPage;
