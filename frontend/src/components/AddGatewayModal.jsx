import { useState } from 'react';
import { X } from 'lucide-react';

const DEFAULT_RELAY_COUNT = 8;

/**
 * AddGatewayModal — form to register a new KNX gateway with relay/status GAs.
 */
export default function AddGatewayModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    id: '',
    name: '',
    ip: '',
    port: 3671,
    relayCount: DEFAULT_RELAY_COUNT,
    relay_addresses: Array(DEFAULT_RELAY_COUNT).fill(''),
    status_addresses: Array(DEFAULT_RELAY_COUNT).fill(''),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const updateField = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const updateRelayCount = (count) => {
    const n = Math.max(1, Math.min(16, parseInt(count) || 1));
    setForm((prev) => ({
      ...prev,
      relayCount: n,
      relay_addresses: Array(n)
        .fill('')
        .map((_, i) => prev.relay_addresses[i] || ''),
      status_addresses: Array(n)
        .fill('')
        .map((_, i) => prev.status_addresses[i] || ''),
    }));
  };

  const updateGA = (type, index, value) =>
    setForm((prev) => {
      const arr = [...prev[type]];
      arr[index] = value;
      return { ...prev, [type]: arr };
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave({
        id: form.id.trim(),
        name: form.name.trim(),
        ip: form.ip.trim(),
        port: parseInt(form.port),
        relay_addresses: form.relay_addresses.filter((a) => a.trim()),
        status_addresses: form.status_addresses.filter((a) => a.trim()),
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">Add Gateway</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Gateway ID</label>
              <input
                className="input-field font-mono"
                placeholder="devtable_01"
                value={form.id}
                onChange={(e) => updateField('id', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Name</label>
              <input
                className="input-field"
                placeholder="Dev Table 1"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1.5">IP Address</label>
              <input
                className="input-field font-mono"
                placeholder="192.168.1.10"
                value={form.ip}
                onChange={(e) => updateField('ip', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Port</label>
              <input
                className="input-field font-mono"
                type="number"
                value={form.port}
                onChange={(e) => updateField('port', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Relay Count */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Number of Relays</label>
            <input
              className="input-field w-24 font-mono"
              type="number"
              min="1"
              max="16"
              value={form.relayCount}
              onChange={(e) => updateRelayCount(e.target.value)}
            />
          </div>

          {/* GA Mapping Table */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Group Address Mapping</label>
            <div className="glass-card p-3 space-y-2 max-h-48 overflow-y-auto">
              <div className="grid grid-cols-[40px_1fr_1fr] gap-2 text-xs text-gray-500 font-medium px-1">
                <span>#</span>
                <span>Relay GA (ON/OFF)</span>
                <span>Status GA (Read)</span>
              </div>
              {Array.from({ length: form.relayCount }).map((_, i) => (
                <div key={i} className="grid grid-cols-[40px_1fr_1fr] gap-2 items-center">
                  <span className="text-xs text-gray-500 text-center">{i + 1}</span>
                  <input
                    className="input-field font-mono !py-1.5 !text-xs"
                    placeholder={`3/0/${i + 1}`}
                    value={form.relay_addresses[i] || ''}
                    onChange={(e) => updateGA('relay_addresses', i, e.target.value)}
                  />
                  <input
                    className="input-field font-mono !py-1.5 !text-xs"
                    placeholder={`3/0/${i + 9}`}
                    value={form.status_addresses[i] || ''}
                    onChange={(e) => updateGA('status_addresses', i, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/25 px-4 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save Gateway'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
