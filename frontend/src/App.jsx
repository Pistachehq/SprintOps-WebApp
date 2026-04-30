import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import AppRouter from './router/AppRouter';
import { AuthProvider } from './features/auth/hooks/useAuth';
import { useScrollbarRevealOnScroll } from './hooks/useScrollbarRevealOnScroll';
import './styles/globals.css';

function App() {
  useScrollbarRevealOnScroll();

  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster richColors position="top-right" />
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
