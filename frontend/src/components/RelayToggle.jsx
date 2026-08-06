import { useState } from 'react';
import { sendCommand } from '../api/client';

/**
 * RelayToggle — single relay channel with ON/OFF toggle and status indicator.
 */
export default function RelayToggle({ gatewayId, relayGA, statusGA, index }) {
  const [state, setState] = useState('unknown'); // 'on' | 'off' | 'pending' | 'unknown'
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    const newAction = state === 'on' ? 'OFF' : 'ON';
    setBusy(true);
    setState('pending');

    try {
      const res = await sendCommand(gatewayId, [relayGA], newAction);
      const result = res.results?.[0];
      if (result?.success) {
        setState(newAction === 'ON' ? 'on' : 'off');
      } else {
        setState('unknown');
      }
    } catch {
      setState('unknown');
    } finally {
      setBusy(false);
    }
  };

  const dotClass = {
    on: 'status-dot-on',
    off: 'status-dot-off',
    pending: 'status-dot-pending',
    unknown: 'status-dot-unknown',
  };

  return (
    <div className="glass-card p-4 flex items-center justify-between gap-4">
      {/* Info */}
      <div className="flex items-center gap-3 min-w-0">
        <span className={dotClass[state]} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">Relay {index + 1}</p>
          <p className="text-xs font-mono text-gray-500 truncate" title={relayGA}>
            {relayGA}
            {statusGA && (
              <span className="text-gray-600"> → {statusGA}</span>
            )}
          </p>
        </div>
      </div>

      {/* Toggle */}
      <button
        onClick={toggle}
        disabled={busy}
        className="toggle-track flex-shrink-0"
        data-state={state === 'unknown' ? 'off' : state}
        title={state === 'on' ? 'Turn OFF' : 'Turn ON'}
      >
        <div className="toggle-thumb" />
      </button>
    </div>
  );
}
