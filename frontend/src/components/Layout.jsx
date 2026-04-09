import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 overflow-y-auto bg-[#F0EFED]">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
