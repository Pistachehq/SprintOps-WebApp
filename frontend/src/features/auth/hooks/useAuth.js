import { useState, useEffect } from 'react';
import { hasPermission } from '../../../domain/permissions/rolePermissions';
import apiClient from '../../../data/api/apiClient';

const normalizeRole = (backendRole) => {
  const map = {
    'Developer': 'developer',
    'Scrum Master': 'scrumMaster',
    'Product Owner': 'productOwner',
  };
  return map[backendRole] || backendRole;
};

export const useAuth = () => {
  const [user, setUser] = useState(() => {
    // Hydrate from localStorage
    const stored = localStorage.getItem("auth_user");
    if (stored) {
      try { return JSON.parse(stored); } catch { return null; }
    }
    return null;
  });

  const login = async (username, password) => {
    const userData = await apiClient.post('/auth/login', { username, password });
    userData.role = normalizeRole(userData.role);
    localStorage.setItem("auth_user", JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem("auth_user");
    setUser(null);
  };

  const checkPermission = (action) => {
    if (!user) return false;
    return hasPermission(user.role, action);
  };

  const isAuthenticated = !!user;

  return { user, login, logout, isAuthenticated, checkPermission };
};
