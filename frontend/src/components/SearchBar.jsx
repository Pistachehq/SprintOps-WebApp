import React, { useState } from 'react';
import { Search } from 'lucide-react';

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  return (
    <div className="relative w-[300px]">
      <input
        type="text"
        placeholder="Busqueda"
        value={query}
        onChange={handleChange}
        className="w-full h-10 px-12 rounded-full bg-white text-gray-700 text-sm focus:outline-none placeholder:text-gray-400"
      />
      <Search 
        size={18} 
        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" 
      />
    </div>
  );
};

export default SearchBar;
