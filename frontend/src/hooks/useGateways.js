import { useState, useEffect, useCallback } from 'react';
import { fetchGateways, addGateway as apiAddGateway, deleteGateway as apiDeleteGateway } from '../api/client';

/**
 * Hook to manage the list of gateways with loading / error state.
 */
export function useGateways() {
  const [gateways, setGateways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGateways();
      setGateways(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addGateway = useCallback(async (data) => {
    await apiAddGateway(data);
    await load();
  }, [load]);

  const removeGateway = useCallback(async (id) => {
    await apiDeleteGateway(id);
    await load();
  }, [load]);

  return { gateways, loading, error, reload: load, addGateway, removeGateway };
}
