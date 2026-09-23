import { createContext, useContext, useState, useEffect } from 'react';
import {
  getUsers, saveUsers, getCurrentUser, setCurrentUser, clearCurrentUser, generateId
} from '../lib/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = getCurrentUser();
    if (saved) setUser(saved);
    setLoading(false);
  }, []);

  const login = (email, password) => {
    const users = getUsers();
    const found = users.find(u => u.email === email && u.password === password);
    if (!found) throw new Error('Invalid email or password');
    const userData = { id: found.id, email: found.email, name: found.name };
    setCurrentUser(userData);
    setUser(userData);
    return userData;
  };

  const register = (name, email, password) => {
    const users = getUsers();
    if (users.find(u => u.email === email)) throw new Error('Email already registered');
    const newUser = { id: generateId(), name, email, password };
    users.push(newUser);
    saveUsers(users);
    const userData = { id: newUser.id, email: newUser.email, name: newUser.name };
    setCurrentUser(userData);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    clearCurrentUser();
    setUser(null);
  };

  const resetPassword = (email, newPassword) => {
    const users = getUsers();
    const idx = users.findIndex(u => u.email === email);
    if (idx === -1) throw new Error('Email not found');
    users[idx].password = newPassword;
    saveUsers(users);
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
