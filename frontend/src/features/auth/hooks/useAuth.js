import { useState, useEffect } from 'react';
import { usersRepository } from '../../../data/repositories/usersRepository';
import { hasPermission } from '../../../domain/permissions/rolePermissions';

export const useAuth = () => {
  const [user, setUser] = useState(() => {
    // Attempt to hydrate from localStorage ID
    const userId = localStorage.getItem("auth_user_id");
    if (userId) {
      const dbUser = usersRepository.getById(userId);
      return dbUser || null;
    }
    return null;
  });

  const login = (role, username) => {
    // Find the user simulating a login (mock)
    let dbUser = usersRepository.getByUsername(username);

    // If user doesn't exist, we'll create a temp mock user
    if (!dbUser) {
        dbUser = usersRepository.create({
            name: username,
            username: username,
            email: `${username}@mock.com`,
            role: role,
            active: true
        });
    }

    localStorage.setItem("auth_user_id", dbUser.id);
    setUser(dbUser);
  };

  const logout = () => {
    localStorage.removeItem("auth_user_id");
    setUser(null);
  };

  const checkPermission = (action) => {
    if (!user) return false;
    return hasPermission(user.role, action);
  };

  const isAuthenticated = !!user;

  return { user, login, logout, isAuthenticated, checkPermission };
};
