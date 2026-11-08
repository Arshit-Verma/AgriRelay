import React from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiGet } from '../api/client';
import { flushOutbox, getQueuedFlags } from '../api/outbox';
import { useAuth } from './AuthContext';

const ZoneContext = createContext(null);

export function ZoneProvider({ children }) {
  const { officer } = useAuth();
  const officerId = officer?.id ?? null;
  const [savedFlags, setSavedFlags] = useState([]);
  const [queuedFlags, setQueuedFlags] = useState([]);

  const refreshQueuedFlags = useCallback(() => {
    setQueuedFlags(getQueuedFlags(officerId));
  }, [officerId]);

  // Sends anything saved while offline, then loads the latest flags. Runs again on reconnecting.
  useEffect(() => {
    if (!officerId) return undefined;
    let cancelled = false;

    const syncAndLoad = async () => {
      await flushOutbox(officerId);
      if (cancelled) return;
      refreshQueuedFlags();

      try {
        const flags = await apiGet('/api/contamination-flags');
        if (!cancelled) setSavedFlags(flags);
      } catch (err) {
        console.error('Error fetching contamination flags:', err);
      }
    };

    syncAndLoad();
    window.addEventListener('online', syncAndLoad);

    return () => {
      cancelled = true;
      window.removeEventListener('online', syncAndLoad);
    };
  }, [officerId, refreshQueuedFlags]);

  const addContaminationFlag = useCallback((flag) => {
    setSavedFlags((current) => [flag, ...current]);
  }, []);

  const value = useMemo(() => {
    const contaminationFlags = [...queuedFlags, ...savedFlags];

    return {
      zone: officer?.zone ?? null,
      district: officer?.district ?? null,
      zoneCode: officer?.zoneCode ?? null,
      center: officer?.center ?? null,
      cropsManaged: officer?.cropsManaged ?? [],
      contaminationFlags,
      hasHighSeverityFlag: contaminationFlags.some((flag) => flag.severity === 'high'),
      addContaminationFlag,
      refreshQueuedFlags,
    };
  }, [officer, queuedFlags, savedFlags, addContaminationFlag, refreshQueuedFlags]);

  return <ZoneContext.Provider value={value}>{children}</ZoneContext.Provider>;
}

export function useZone() {
  const context = useContext(ZoneContext);
  if (!context) {
    throw new Error('useZone must be used within ZoneProvider');
  }
  return context;
}
