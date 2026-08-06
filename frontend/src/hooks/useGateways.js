import { useState, useEffect, useCallback } from 'react';
import {
  fetchGateways,
  fetchGatewayStatuses,
  addGateway as apiAddGateway,
  deleteGateway as apiDeleteGateway,
} from '../api/client';

/**
 * Hook to manage the list of gateways and their live online/offline statuses.
 */
export function useGateways() {
  const [gateways, setGateways] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkStatuses = useCallback(async () => {
    try {
      const stMap = await fetchGatewayStatuses();
      setStatuses(stMap);
    } catch {
      // status check non-blocking
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGateways();
      setGateways(data);
      // Immediately trigger background status check
      checkStatuses();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [checkStatuses]);

  useEffect(() => {
    load();
  }, [load]);

  // Poll online/offline status every 15 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      checkStatuses();
    }, 15000);
    return () => clearInterval(timer);
  }, [checkStatuses]);

  const addGateway = useCallback(async (data) => {
    await apiAddGateway(data);
    await load();
  }, [load]);

  const removeGateway = useCallback(async (id) => {
    await apiDeleteGateway(id);
    await load();
  }, [load]);

  return {
    gateways,
    statuses,
    loading,
    error,
    reload: load,
    addGateway,
    removeGateway,
  };
}

