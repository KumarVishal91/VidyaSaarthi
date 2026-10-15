'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

// Loads a path once, and again whenever reload() is called. Pass null to skip.
export function useApi(path) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(Boolean(path));

  const reload = useCallback(async () => {
    if (!path) return;
    try {
      setData(await api(path));
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => { reload(); }, [reload]);
  return { data, error, loading, reload };
}
