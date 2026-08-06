import { useState } from 'react';
import { Power, PowerOff, Server } from 'lucide-react';
import { sendCommand } from '../api/client';
import RelayToggle from './RelayToggle';

/**
 * RelayMatrix — grid of relay toggles for a selected gateway.
 */
export default function RelayMatrix({ gateway }) {
  const [bulkBusy, setBulkBusy] = useState(false);

  if (!gateway) {
    return (
      <section className="glass-card p-12 text-center">
        <Server size={32} className="text-gray-600 mx-auto mb-3" />
        <h3 className="text-white font-medium mb-1">Select a Gateway</h3>
        <p className="text-gray-400 text-sm">
          Click a gateway card above to view and control its relays.
        </p>
      </section>
    );
  }

  const relays = gateway.relay_addresses || [];
  const statuses = gateway.status_addresses || [];

  const handleBulk = async (action) => {
    if (relays.length === 0) return;
    setBulkBusy(true);
    try {
      await sendCommand(gateway.id, relays, action);
    } catch {
      // Individual toggles handle their own errors
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <section>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">{gateway.name}</h2>
          <p className="text-sm text-gray-400 font-mono">
            {gateway.ip}:{gateway.port} · {relays.length} relay{relays.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleBulk('ON')}
            disabled={bulkBusy || relays.length === 0}
            className="btn-success flex items-center gap-1.5 !text-xs !px-3 !py-2"
          >
            <Power size={14} />
            All ON
          </button>
          <button
            onClick={() => handleBulk('OFF')}
            disabled={bulkBusy || relays.length === 0}
            className="btn-danger flex items-center gap-1.5 !text-xs !px-3 !py-2"
          >
            <PowerOff size={14} />
            All OFF
          </button>
        </div>
      </div>

      {/* Relay grid */}
      {relays.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-gray-400 text-sm">
            No relay addresses configured for this gateway.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {relays.map((ga, i) => (
            <RelayToggle
              key={`${gateway.id}-${ga}`}
              gatewayId={gateway.id}
              relayGA={ga}
              statusGA={statuses[i] || null}
              index={i}
            />
          ))}
        </div>
      )}
    </section>
  );
}
