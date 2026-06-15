import React from "react";
import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [officer, setOfficer] = useState(null);

  const login = (officerData) => {
    if (typeof officerData === 'object' && officerData !== null) {
      setOfficer(officerData);
      return;
    }
  };

  const logout = () => setOfficer(null);

  const value = useMemo(() => ({ officer, login, logout }), [officer]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

