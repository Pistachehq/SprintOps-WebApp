import React from 'react';
import { X } from 'lucide-react';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidthClass = 'max-w-lg',
  bodyClassName = 'p-6',
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div
        className={`max-h-[92vh] w-full ${maxWidthClass} overflow-hidden rounded-2xl bg-white shadow-xl animate-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
          <h2 id="modal-title" className="text-lg font-bold text-slate-900 sm:text-xl">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition-colors hover:bg-gray-100"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>
        <div className={`${bodyClassName} max-h-[calc(92vh-4.5rem)] overflow-y-auto [scrollbar-width:thin]`}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
