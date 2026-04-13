import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { usersRepository } from '../../data/repositories/usersRepository';

const roleLabel = (role) => {
  const map = { developer: 'Developer', scrumMaster: 'Scrum Master', productOwner: 'Product Owner' };
  return map[role] || role;
};

const AddUserModal = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    if (isOpen) {
      usersRepository.getAll().then(users => setAllUsers(users || [])).catch(() => setAllUsers([]));
      setName('');
      setSelectedUser(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (name.trim() === '') {
      setSuggestions([]);
      return;
    }
    const filtered = allUsers.filter(u => 
      u.name.toLowerCase().includes(name.toLowerCase()) || 
      u.username.toLowerCase().includes(name.toLowerCase())
    );
    setSuggestions(filtered);
  }, [name, allUsers]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedUser) {
      onAdd(selectedUser);
    } else {
      onAdd({ name });
    }
    setName('');
    setSelectedUser(null);
    onClose();
  };

  const selectUser = (user) => {
    setName(user.name);
    setSelectedUser(user);
    setShowSuggestions(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
          <h2 className="text-xl font-black text-gray-800 tracking-tight">Agregar Usuario</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="relative">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Nombre</label>
            <div className="relative">
              <input 
                required
                className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#446E51] bg-gray-50"
                value={name}
                onChange={e => {
                  setName(e.target.value);
                  setSelectedUser(null);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Ej. Axel"
              />
              <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-50 max-h-40 overflow-y-auto">
                {suggestions.map(u => (
                  <div 
                    key={u.id}
                    onClick={() => selectUser(u)}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                  >
                    <p className="font-bold text-sm text-gray-800">{u.name}</p>
                    <p className="text-[10px] text-gray-400">@{u.username} · {roleLabel(u.role)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="mt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 h-12 bg-gray-100 text-slate-600 font-bold rounded-xl hover:bg-gray-200 transition-colors">
              Cancelar
            </button>
            <button type="submit" className="flex-1 h-12 bg-[#446E51] text-white font-bold rounded-xl hover:bg-[#355640] transition-colors shadow-lg shadow-green-900/20">
              Añadir al equipo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;
