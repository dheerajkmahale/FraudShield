import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Generic data-fetching hook: runs `fetcher` whenever `deps` change, and
 * exposes { data, loading, error, refetch }. Centralizes the loading/error
 * boilerplate that would otherwise be duplicated across every page.
 */
export function useApi(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetcherRef.current();
      setData(res);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refetch: load };
}
