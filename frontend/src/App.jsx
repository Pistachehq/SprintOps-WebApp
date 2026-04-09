import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import AppRouter from './router/AppRouter';
import './styles/globals.css';

function App() {
  return (
    <BrowserRouter>
      <Toaster richColors position="top-right" />
      <AppRouter />
    </BrowserRouter>
  );
}

export default App;
