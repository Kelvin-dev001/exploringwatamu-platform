import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '@/api.js';

/** Fetch a public list endpoint (array or { data: [] }). Returns { items, loading, error, retry }. */
export default function useListing(path, params) {
  const [state, setState] = useState({ items: [], loading: true, error: null });
  const key = JSON.stringify(params || {});
  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    axios
      .get(`${API_URL}${path}`, { params })
      .then((res) => {
        const d = res.data;
        setState({ items: Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [], loading: false, error: null });
      })
      .catch((error) => setState({ items: [], loading: false, error }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, key]);
  useEffect(load, [load]);
  return { ...state, retry: load };
}
