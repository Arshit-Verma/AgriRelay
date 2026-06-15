import React from "react";
import { createContext, useContext, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

const ZoneContext = createContext(null);

export function ZoneProvider({ children }) {
  const { officer } = useAuth();

  const value = useMemo(
    () => ({
      zone: officer?.zone ?? null,
      district: officer?.district ?? null,
      cropsManaged: officer?.cropsManaged ?? [],
    }),
    [officer],
  );

  return <ZoneContext.Provider value={value}>{children}</ZoneContext.Provider>;
}

export function useZone() {
  const context = useContext(ZoneContext);
  if (!context) {
    throw new Error('useZone must be used within ZoneProvider');
  }
  return context;
}
