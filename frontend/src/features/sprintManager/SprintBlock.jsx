import React from 'react';

const SprintBlock = ({ label, vertical, isMain, onClick, icon: Icon, stats, progress }) => {
  const baseClasses = "relative bg-[#446E51] rounded-[32px] shadow-[0_20px_50px_rgba(68,110,81,0.2)] hover:shadow-[0_25px_60px_rgba(68,110,81,0.3)] hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 cursor-pointer flex flex-col items-center justify-center overflow-hidden group border border-white/10";
  
  const width = isMain ? "w-[600px]" : "w-[180px]";
  const height = "h-[480px]";

  return (
    <div 
      onClick={onClick}
      className={`${baseClasses} ${width} ${height}`}
    >
      {/* Background Gradient Layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
      
      {/* Glow Effect */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-white/5 blur-[80px] rounded-full group-hover:bg-white/10 transition-all duration-500" />
      
      {/* Content */}
      <div className={`relative flex flex-col items-center justify-center gap-6 ${vertical ? '-rotate-90' : ''}`}>
        {Icon && (
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md mb-2 group-hover:scale-110 transition-transform duration-500">
            <Icon size={32} className="text-white" />
          </div>
        )}
        
        <div className="text-center flex flex-col items-center">
          <span className={`text-white font-black tracking-tight whitespace-nowrap select-none block leading-none ${stats ? 'text-[32px]' : 'text-[42px]'}`}>
            {label}
          </span>
          {stats && (
            <span className="text-white/60 text-sm font-bold uppercase tracking-[0.2em] mt-3 block">
              {stats}
            </span>
          )}
        </div>
      </div>

      {/* Decorative Line (Only for main) */}
      {isMain && (
        <div className="absolute bottom-10 left-10 right-10 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-white/40 rounded-full transition-all duration-500" style={{ width: `${progress ?? 66}%` }} />
        </div>
      )}
    </div>
  );
};

export default SprintBlock;
