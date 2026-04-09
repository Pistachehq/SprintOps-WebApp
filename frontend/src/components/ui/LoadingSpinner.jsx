import React from 'react';

const LoadingSpinner = ({ label = 'Cargando...', fullPage = false }) => {
  const containerClasses = fullPage 
    ? "flex flex-col items-center justify-center min-h-[50vh] w-full" 
    : "flex flex-col items-center justify-center p-8 w-full";

  return (
    <div className={containerClasses}>
      <div className="relative flex justify-center items-center h-12 w-12">
        <div className="absolute animate-ping inline-flex h-full w-full rounded-full bg-oracle-main opacity-20"></div>
        <div className="relative inline-flex rounded-full h-8 w-8 bg-oracle-main bg-opacity-80"></div>
      </div>
      {label && <p className="mt-4 text-sm font-bold text-gray-400 animate-pulse">{label}</p>}
    </div>
  );
};

export default LoadingSpinner;
