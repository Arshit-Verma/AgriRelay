const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

let authToken = null;
let handleUnauthorized = null;
let lastSyncedAt = null;
const syncListeners = new Set();

export const setAuthToken = (token) => {
  authToken = token;
};

export const setUnauthorizedHandler = (handler) => {
  handleUnauthorized = handler;
};

export const getLastSyncedAt = () => lastSyncedAt;

export const subscribeToSync = (listener) => {
  syncListeners.add(listener);
  return () => {
    syncListeners.delete(listener);
  };
};

// Uses the server's timestamp, which a cached response keeps, so old data is shown as old.
function recordSync(res) {
  const responseTime = Date.parse(res.headers.get('date') ?? '');
  if (responseTime > (lastSyncedAt ?? 0)) {
    lastSyncedAt = responseTime;
    syncListeners.forEach((listener) => listener());
  }
}

export function apiUrl(path, params = {}) {
  const url = new URL(path, BASE_URL);
  Object.entries(params).forEach(([key, value]) => {
    if (value != null) url.searchParams.set(key, value);
  });
  return url.toString();
}

export async function fetchJson(url, options = {}) {
  const headers = { ...options.headers, ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) };
  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    if (res.status === 401 && authToken) handleUnauthorized?.();
    const error = new Error(`Request failed with status ${res.status}`);
    error.status = res.status;
    throw error;
  }

  recordSync(res);
  return res.json();
}

export const apiGet = (path, params) => fetchJson(apiUrl(path, params));

export const apiPost = (path, body) =>
  fetchJson(apiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
