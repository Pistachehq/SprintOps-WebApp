import React from 'react';

const ProjectCard = ({ project, onSelect }) => {
  const { name, start, image, colorOverlay } = project;

  return (
    <div className="bg-white rounded-[20px] overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
      {/* Image Container */}
      <div className="relative h-48 overflow-hidden bg-slate-100 flex items-center justify-center">
        {image ? (
          <img 
            src={image} 
            alt={name} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = `<div class="w-full h-full flex flex-col items-center justify-center text-slate-300"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>`;
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#446E51] to-[#2d4a36] flex flex-col items-center justify-center">
            <span className="text-white/30 text-5xl font-black tracking-tighter">{name?.charAt(0) || '?'}</span>
          </div>
        )}
        
        {/* Color Overlay */}
        <div 
          className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
          style={{ backgroundColor: colorOverlay }}
        />
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col items-center">
        <h3 className="text-xl font-bold text-gray-800 mb-1">{name}</h3>
        <p className="text-sm text-gray-500 mb-4">{start}</p>
        
        <button 
          onClick={() => onSelect(project)}
          className="px-8 py-2 bg-[#446E51] text-white rounded-lg font-bold text-sm hover:opacity-90 transition-opacity"
        >
          Detalles
        </button>
      </div>
    </div>
  );
};

export default ProjectCard;
