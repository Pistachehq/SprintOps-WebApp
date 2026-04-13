import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex flex-col h-screen">
      <Navbar onSearch={setSearchQuery} />
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#F0EFED]">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <Outlet context={{ searchQuery, setSearchQuery }} />
        </div>
      </main>
    </div>
  );
};

export default Layout;
