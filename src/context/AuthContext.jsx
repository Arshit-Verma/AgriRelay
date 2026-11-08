import React from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { API_CACHE_NAME } from '../api/cacheNames';
import { setAuthToken, setUnauthorizedHandler } from '../api/client';

const AuthContext = createContext(null);

const STORAGE_KEY = 'agrirelay.officer';

function readStoredOfficer() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    // Sessions saved before real sign-in have no token and must sign in again.
    return stored?.token ? stored : null;
  } catch {
    return null;
  }
}

function writeStoredOfficer(officer) {
  try {
    if (officer) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(officer));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Storage can be blocked (e.g. private browsing); the session then just ends on refresh.
  }
}

// Set before anything renders so the first page requests already carry the token.
const initialOfficer = readStoredOfficer();
setAuthToken(initialOfficer?.token ?? null);

export function AuthProvider({ children }) {
  const [officer, setOfficer] = useState(initialOfficer);

  const login = useCallback((session) => {
    setAuthToken(session.token);
    setOfficer(session);
    writeStoredOfficer(session);
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    setOfficer(null);
    writeStoredOfficer(null);
    // Saved farmer data must not be readable by whoever signs in next on this device.
    if ('caches' in window) caches.delete(API_CACHE_NAME).catch(() => {});
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
      toast.error('Your session has expired. Please sign in again.');
    });
  }, [logout]);

  const value = useMemo(() => ({ officer, login, logout }), [officer, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
