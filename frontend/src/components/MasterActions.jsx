import { useState } from 'react';
import { Zap, ZapOff, AlertTriangle, Droplets, ChevronDown } from 'lucide-react';
import { powerUpAll, shutdownAll, sendCommand } from '../api/client';

/** Flavor group addresses — exclusive selection (one ON, rest OFF). */
const FLAVORS = [
  { id: 'aromatic', label: 'Aromatic', ga: '3/0/3', color: 'amber' },
  { id: 'menthol',  label: 'Menthol',  ga: '3/0/5', color: 'cyan' },
  { id: 'tobacco',  label: 'Tobacco',  ga: '3/0/8', color: 'orange' },
  { id: 'newflavor', label: 'New Flavor', ga: '3/0/9', color: 'violet' },
];

/**
 * MasterActions — global power-up / shutdown + flavor switching.
 */
export default function MasterActions({ gatewayCount, gateways = [] }) {
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null); // 'powerup' | 'shutdown' | null
  const [result, setResult] = useState(null);

  // ── Flavor state ──
  const [flavorGwId, setFlavorGwId] = useState('');
  const [activeFlavor, setActiveFlavor] = useState(null);
  const [flavorBusy, setFlavorBusy] = useState(false);
  const [flavorResult, setFlavorResult] = useState(null);

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

  const switchFlavor = async (flavor) => {
    if (!flavorGwId) return;
    setFlavorBusy(true);
    setFlavorResult(null);
    try {
      // Turn OFF all other flavors, turn ON the selected one
      const offAddresses = FLAVORS.filter((f) => f.id !== flavor.id).map((f) => f.ga);
      if (offAddresses.length > 0) {
        await sendCommand(flavorGwId, offAddresses, 'OFF');
      }
      await sendCommand(flavorGwId, [flavor.ga], 'ON');
      setActiveFlavor(flavor.id);
      setFlavorResult({ success: true, label: flavor.label });
    } catch (err) {
      setFlavorResult({ error: err.message });
    } finally {
      setFlavorBusy(false);
    }
  };

  /** Tailwind color map for flavor buttons. */
  const colorMap = {
    amber:  { ring: 'ring-amber-500/50',  bg: 'bg-amber-500/15',  border: 'border-amber-500/30',  hoverBorder: 'hover:border-amber-400/60',  text: 'text-amber-400',  activeBg: 'bg-amber-500/25',  activeBorder: 'border-amber-400',  shadow: 'shadow-amber-500/20' },
    cyan:   { ring: 'ring-cyan-500/50',   bg: 'bg-cyan-500/15',   border: 'border-cyan-500/30',   hoverBorder: 'hover:border-cyan-400/60',   text: 'text-cyan-400',   activeBg: 'bg-cyan-500/25',   activeBorder: 'border-cyan-400',   shadow: 'shadow-cyan-500/20' },
    orange: { ring: 'ring-orange-500/50', bg: 'bg-orange-500/15', border: 'border-orange-500/30', hoverBorder: 'hover:border-orange-400/60', text: 'text-orange-400', activeBg: 'bg-orange-500/25', activeBorder: 'border-orange-400', shadow: 'shadow-orange-500/20' },
    violet: { ring: 'ring-violet-500/50', bg: 'bg-violet-500/15', border: 'border-violet-500/30', hoverBorder: 'hover:border-violet-400/60', text: 'text-violet-400', activeBg: 'bg-violet-500/25', activeBorder: 'border-violet-400', shadow: 'shadow-violet-500/20' },
  };

  return (
    <div className="space-y-6">
      {/* ── Bulk Power Section ──────────────────────────────────── */}
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
      </section>

      {/* ── Flavor Switch Section ──────────────────────────────── */}
      <section className="glass-card p-6">
        <div className="flex items-center gap-3 mb-1">
          <Droplets size={20} className="text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Flavor Switch</h2>
        </div>
        <p className="text-sm text-gray-400 mb-5">
          Select a gateway and switch to a flavor. The active flavor turns ON while all others turn OFF.
        </p>

        {/* Gateway selector */}
        <div className="mb-5">
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Target Gateway</label>
          <div className="relative">
            <select
              value={flavorGwId}
              onChange={(e) => { setFlavorGwId(e.target.value); setActiveFlavor(null); setFlavorResult(null); }}
              className="input-field appearance-none pr-10 cursor-pointer"
            >
              <option value="">— Select a gateway —</option>
              {gateways.map((gw) => (
                <option key={gw.id} value={gw.id}>{gw.name} ({gw.ip})</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        </div>

        {/* Flavor buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {FLAVORS.map((flavor) => {
            const c = colorMap[flavor.color];
            const isActive = activeFlavor === flavor.id;
            return (
              <button
                key={flavor.id}
                onClick={() => switchFlavor(flavor)}
                disabled={flavorBusy || !flavorGwId}
                className={`relative group rounded-2xl p-4 text-center transition-all duration-300
                  border ${isActive ? `${c.activeBg} ${c.activeBorder} shadow-lg ${c.shadow}` : `${c.bg} ${c.border} ${c.hoverBorder}`}
                  disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <Droplets size={24} className={`mx-auto mb-2 ${c.text} transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                <h4 className={`font-semibold text-sm ${isActive ? 'text-white' : 'text-gray-300'}`}>{flavor.label}</h4>
                <p className="text-[10px] text-gray-500 mt-0.5 font-mono">{flavor.ga}</p>
                {isActive && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Flavor result banner */}
        {flavorResult && (
          <div
            className={`mt-4 rounded-xl px-4 py-3 text-sm ${
              flavorResult.error
                ? 'bg-red-500/10 border border-red-500/25 text-red-400'
                : 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400'
            }`}
          >
            {flavorResult.error ? (
              <p>Error: {flavorResult.error}</p>
            ) : (
              <p>Switched to <strong>{flavorResult.label}</strong> successfully.</p>
            )}
          </div>
        )}
      </section>

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
    </div>
  );
}
