import { useEffect, useState } from 'react';
import { apiUrl, fetchJson } from '../api/client';

// Loads JSON from the API and reloads when the path or params change.
// Pass a null path to wait until the request's inputs are known.
export function useApi(path, params) {
  const url = path ? apiUrl(path, params) : null;
  const [state, setState] = useState({ data: null, error: null });

  useEffect(() => {
    if (!url) return undefined;
    let cancelled = false;

    fetchJson(url)
      .then((data) => {
        if (!cancelled) setState({ data, error: null });
      })
      .catch((error) => {
        console.error(`Error loading ${url}:`, error);
        if (!cancelled) setState({ data: null, error });
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return state;
}
