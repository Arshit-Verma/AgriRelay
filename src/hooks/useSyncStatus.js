import { useEffect, useState, useSyncExternalStore } from 'react';
import { getLastSyncedAt, subscribeToSync } from '../api/client';

const REFRESH_LABEL_MS = 30000;

const subscribeToConnection = (listener) => {
  window.addEventListener('online', listener);
  window.addEventListener('offline', listener);
  return () => {
    window.removeEventListener('online', listener);
    window.removeEventListener('offline', listener);
  };
};

function describeAge(timestamp, now) {
  const minutes = Math.floor((now - timestamp) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.floor(hours / 24)} days ago`;
}

// Returns text such as "Synced 3 min ago" or "Offline · data from 2 hr ago".
export function useSyncStatus() {
  const isOnline = useSyncExternalStore(subscribeToConnection, () => navigator.onLine);
  const lastSyncedAt = useSyncExternalStore(subscribeToSync, getLastSyncedAt);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), REFRESH_LABEL_MS);
    return () => clearInterval(timer);
  }, []);

  const age = lastSyncedAt ? describeAge(lastSyncedAt, Math.max(now, lastSyncedAt)) : null;

  if (!isOnline) return age ? `Offline · data from ${age}` : 'Offline';
  return age ? `Synced ${age}` : 'Syncing…';
}
