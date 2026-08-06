/**
 * API client — simple fetch wrapper for the KNX Control backend.
 * Proxied through Vite dev server to http://localhost:8000.
 */

const BASE = '/api/v1';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `HTTP ${res.status}`);
  }

  // 204 No Content
  if (res.status === 204) return null;
  return res.json();
}

/** List all registered gateways. */
export function fetchGateways() {
  return request('/gateways');
}

/** Get a single gateway by ID. */
export function fetchGateway(id) {
  return request(`/gateways/${encodeURIComponent(id)}`);
}

/** Add or update a gateway. */
export function addGateway(data) {
  return request('/gateways', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** Delete a gateway. */
export function deleteGateway(id) {
  return request(`/gateways/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

/** Send ON/OFF command to group addresses on a gateway. */
export function sendCommand(gatewayId, groupAddresses, action) {
  return request('/knx/command', {
    method: 'POST',
    body: JSON.stringify({
      gateway_id: gatewayId,
      group_addresses: groupAddresses,
      action,
    }),
  });
}

/** Read status of a single group address. */
export function readStatus(gatewayId, statusGa) {
  return request('/knx/status', {
    method: 'POST',
    body: JSON.stringify({
      gateway_id: gatewayId,
      status_ga: statusGa,
    }),
  });
}

/** Shutdown all relays across all gateways. */
export function shutdownAll() {
  return request('/routines/shutdown-all', { method: 'POST' });
}

/** Power up all relays across all gateways. */
export function powerUpAll() {
  return request('/routines/powerup-all', { method: 'POST' });
}

// ── Schedules ──────────────────────────────────────────────────

/** List schedules, optionally filtered by gateway_id. */
export function fetchSchedules(gatewayId) {
  const qs = gatewayId ? `?gateway_id=${encodeURIComponent(gatewayId)}` : '';
  return request(`/schedules${qs}`);
}

/** Create a new schedule. */
export function createSchedule(data) {
  return request('/schedules', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** Update a schedule. */
export function updateSchedule(id, data) {
  return request(`/schedules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/** Enable or disable a schedule. */
export function toggleSchedule(id, enabled) {
  return request(`/schedules/${id}/toggle`, {
    method: 'PATCH',
    body: JSON.stringify({ enabled }),
  });
}

/** Delete a schedule. */
export function deleteSchedule(id) {
  return request(`/schedules/${id}`, { method: 'DELETE' });
}

/** Get schedule counts grouped by gateway_id. */
export function fetchScheduleCounts() {
  return request('/schedules/counts');
}

