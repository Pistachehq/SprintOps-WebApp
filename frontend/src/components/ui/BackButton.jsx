import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function BackButton({ label, to, fallbackPath = '/home', className = '' }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      if (window.history.length > 2) {
        navigate(-1);
      } else {
        navigate(fallbackPath, { replace: true });
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 p-2.5 rounded-full bg-white hover:bg-gray-100 shadow-sm transition-all duration-200 text-slate-700 ${className}`}
      title="Volver"
      aria-label="Volver"
    >
      <ArrowLeft size={20} />
      {label && <span className="text-sm font-bold pr-2">{label}</span>}
    </button>
  );
}
