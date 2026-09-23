import { createContext, useContext, useState, useEffect } from 'react';
import {
  getUsers, saveUsers, getCurrentUser, setCurrentUser, clearCurrentUser,
  getUsersSync, getCurrentUserSync, saveUsersSync, setCurrentUserSync, clearCurrentUserSync,
  generateId
} from '../lib/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fast sync boot, then async verify migration
    const saved = getCurrentUserSync();
    if (saved) setUser(saved);
    // Async check for IDB migrated user
    (async () => {
      try {
        const asyncUser = await getCurrentUser();
        if (asyncUser && !saved) setUser(asyncUser);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const login = async (email, password) => {
    const users = await getUsers();
    const found = users.find(u => u.email === email && u.password === password);
    if (!found) throw new Error('Invalid email or password');
    const userData = { id: found.id, email: found.email, name: found.name };
    await setCurrentUser(userData);
    setCurrentUserSync(userData);
    setUser(userData);
    return userData;
  };

  const register = async (name, email, password) => {
    const users = await getUsers();
    if (users.find(u => u.email === email)) throw new Error('Email already registered');
    const newUser = { id: generateId(), name, email, password };
    const updated = [...users, newUser];
    await saveUsers(updated);
    saveUsersSync(updated);
    const userData = { id: newUser.id, email: newUser.email, name: newUser.name };
    await setCurrentUser(userData);
    setCurrentUserSync(userData);
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    await clearCurrentUser();
    clearCurrentUserSync();
    setUser(null);
  };

  const resetPassword = async (email, newPassword) => {
    const users = await getUsers();
    const idx = users.findIndex(u => u.email === email);
    if (idx === -1) throw new Error('Email not found');
    users[idx].password = newPassword;
    await saveUsers(users);
    saveUsersSync(users);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
