import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar onSearch={setSearchQuery} />
      <main className="flex-1 overflow-y-auto bg-[#F0EFED]">
        <Outlet context={{ searchQuery, setSearchQuery }} />
      </main>
    </div>
  );
};

export default Layout;
