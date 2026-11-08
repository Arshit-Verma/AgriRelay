import { apiPost } from './client';

const STORAGE_KEY = 'agrirelay.outbox';
const FLAGS_PATH = '/api/contamination-flags';

let isFlushing = false;

function readOutbox() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
  } catch {
    return [];
  }
}

function writeOutbox(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage can be blocked (e.g. private browsing); the queued item is then lost.
  }
}

// Saves now if possible, otherwise keeps the write on this device.
// A failed connection has no HTTP status. Server rejections do, and still reach the caller.
export async function postOrQueue(path, body, officerId) {
  try {
    return { saved: true, result: await apiPost(path, body) };
  } catch (err) {
    if (err.status) throw err;

    writeOutbox([
      ...readOutbox(),
      { id: `queued-${Date.now()}-${Math.random()}`, path, body, officerId, queuedAt: new Date().toISOString() },
    ]);
    return { saved: false };
  }
}

export const getQueuedFlags = (officerId) =>
  readOutbox()
    .filter((item) => item.path === FLAGS_PATH && item.officerId === officerId)
    .map((item) => ({ ...item.body, id: item.id, date: item.queuedAt.slice(0, 10), pending: true }));

// Sends queued writes oldest first and stops at the first sign the connection is still down.
export async function flushOutbox(officerId) {
  if (isFlushing) return;
  isFlushing = true;

  try {
    for (const item of readOutbox().filter((queued) => queued.officerId === officerId)) {
      try {
        await apiPost(item.path, item.body);
      } catch (err) {
        if (!err.status || err.status === 401) return;
        console.error(`Dropped a queued write the server rejected (${err.status}):`, item.path);
      }
      writeOutbox(readOutbox().filter((queued) => queued.id !== item.id));
    }
  } finally {
    isFlushing = false;
  }
}
