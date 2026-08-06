import { useState } from 'react';
import { Zap, ZapOff, AlertTriangle } from 'lucide-react';
import { powerUpAll, shutdownAll } from '../api/client';

/**
 * MasterActions — global power-up and shutdown buttons with confirmation.
 */
export default function MasterActions({ gatewayCount }) {
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null); // 'powerup' | 'shutdown' | null
  const [result, setResult] = useState(null);

  const execute = async (action) => {
    setBusy(true);
    setResult(null);
    try {
      const res = action === 'powerup' ? await powerUpAll() : await shutdownAll();
      setResult(res);
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  return (
    <section className="glass-card p-6">
      <h2 className="text-lg font-semibold text-white mb-1">Master Control</h2>
      <p className="text-sm text-gray-400 mb-5">
        Execute bulk commands across all {gatewayCount} registered gateway{gatewayCount !== 1 ? 's' : ''}.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Power Up All */}
        <button
          onClick={() => setConfirm('powerup')}
          disabled={busy || gatewayCount === 0}
          className="relative group overflow-hidden rounded-2xl p-6 text-left
                     bg-gradient-to-br from-emerald-600/20 to-emerald-900/10
                     border border-emerald-500/20 hover:border-emerald-500/40
                     transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent
                          opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Zap size={28} className="text-emerald-400 mb-3 relative z-10" />
          <h3 className="text-white font-semibold text-base relative z-10">Power Up All</h3>
          <p className="text-emerald-300/60 text-sm mt-1 relative z-10">
            Turn ON all relays across every gateway
          </p>
        </button>

        {/* Shutdown All */}
        <button
          onClick={() => setConfirm('shutdown')}
          disabled={busy || gatewayCount === 0}
          className="relative group overflow-hidden rounded-2xl p-6 text-left
                     bg-gradient-to-br from-red-600/20 to-red-900/10
                     border border-red-500/20 hover:border-red-500/40
                     transition-all duration-300 hover:shadow-lg hover:shadow-red-500/10"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent
                          opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <ZapOff size={28} className="text-red-400 mb-3 relative z-10" />
          <h3 className="text-white font-semibold text-base relative z-10">Shutdown All</h3>
          <p className="text-red-300/60 text-sm mt-1 relative z-10">
            Turn OFF all relays across every gateway
          </p>
        </button>
      </div>

      {/* Result banner */}
      {result && (
        <div
          className={`mt-4 rounded-xl px-4 py-3 text-sm ${
            result.error
              ? 'bg-red-500/10 border border-red-500/25 text-red-400'
              : result.total_errors > 0
                ? 'bg-amber-500/10 border border-amber-500/25 text-amber-400'
                : 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400'
          }`}
        >
          {result.error ? (
            <p>Error: {result.error}</p>
          ) : (
            <p>
              {result.action} complete — {result.total_gateways} gateway{result.total_gateways !== 1 ? 's' : ''}
              {result.total_errors > 0 && `, ${result.total_errors} error(s)`}
            </p>
          )}
        </div>
      )}

      {/* Confirmation modal */}
      {confirm && (
        <div className="modal-backdrop" onClick={() => !busy && setConfirm(null)}>
          <div className="modal-content !max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
            <AlertTriangle
              size={40}
              className={`mx-auto mb-4 ${
                confirm === 'shutdown' ? 'text-red-400' : 'text-emerald-400'
              }`}
            />
            <h3 className="text-white font-semibold text-lg mb-2">
              {confirm === 'shutdown' ? 'Shutdown All Relays?' : 'Power Up All Relays?'}
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              This will send {confirm === 'shutdown' ? 'OFF' : 'ON'} commands to all relay
              channels on all {gatewayCount} registered gateway{gatewayCount !== 1 ? 's' : ''}.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setConfirm(null)}
                disabled={busy}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={() => execute(confirm)}
                disabled={busy}
                className={confirm === 'shutdown' ? 'btn-danger' : 'btn-success'}
              >
                {busy ? 'Executing…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
