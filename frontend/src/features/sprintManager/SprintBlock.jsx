import React from 'react';

const SprintBlock = ({ label, vertical, isMain, onClick, icon: Icon, stats, progress }) => {
  const baseClasses = "relative bg-[#446E51] rounded-[28px] shadow-[0_16px_40px_rgba(68,110,81,0.2)] hover:shadow-[0_18px_44px_rgba(68,110,81,0.32)] hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-300 cursor-pointer flex flex-col items-center justify-center overflow-hidden group border border-white/10";
  
  const width = isMain ? "w-[480px]" : "w-[148px]";
  const height = "h-[400px]";

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
      <div className={`relative flex flex-col items-center justify-center gap-4 ${vertical ? '-rotate-90' : ''}`}>
        {Icon && (
          <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md mb-1 group-hover:scale-110 transition-transform duration-500">
            <Icon size={28} className="text-white" />
          </div>
        )}
        
        <div className="text-center flex flex-col items-center px-2">
          <span className={`text-white font-black tracking-tight whitespace-nowrap select-none block leading-none ${stats ? 'text-[26px]' : 'text-[34px]'}`}>
            {label}
          </span>
          {stats && (
            <span className="text-white/60 text-[11px] sm:text-xs font-bold uppercase tracking-[0.15em] mt-2 block max-w-[min(100%,22rem)]">
              {stats}
            </span>
          )}
        </div>
      </div>

      {/* Decorative Line (Only for main) */}
      {isMain && (
        <div className="absolute bottom-8 left-8 right-8 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-white/40 rounded-full transition-all duration-500" style={{ width: `${progress ?? 66}%` }} />
        </div>
      )}
    </div>
  );
};

export default SprintBlock;
