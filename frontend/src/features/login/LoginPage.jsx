import React from 'react';
import LoginForm from './LoginForm';

const LoginPage = () => {
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
