import { useState, useEffect } from 'react';
import { X, Clock } from 'lucide-react';

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * ScheduleModal — form for creating or editing a schedule.
 */
export default function ScheduleModal({ gateways = [], defaultGatewayId = 'ALL', schedule, onClose, onSave }) {
  const isEditing = !!schedule;

  const [form, setForm] = useState({
    gateway_id: defaultGatewayId || 'ALL',
    action: 'OFF',
    time: '18:00',
    days: [...ALL_DAYS],
    enabled: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (schedule) {
      setForm({
        gateway_id: schedule.gateway_id,
        action: schedule.action,
        time: schedule.time,
        days: [...schedule.days],
        enabled: schedule.enabled,
      });
    }
  }, [schedule]);

  const toggleDay = (day) => {
    setForm((prev) => {
      const has = prev.days.includes(day);
      const next = has ? prev.days.filter((d) => d !== day) : [...prev.days, day];
      // Don't allow removing all days
      return next.length > 0 ? { ...prev, days: next } : prev;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave({
        gateway_id: form.gateway_id,
        action: form.action,
        time: form.time,
        days: form.days,
        enabled: form.enabled,
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
      <div className="modal-content !max-w-md" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-knx-accent" />
            <h2 className="text-lg font-semibold text-white">
              {isEditing ? 'Edit Schedule' : 'New Schedule'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Target Scope */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Target Scope</label>
            <select
              className="input-field cursor-pointer font-medium"
              value={form.gateway_id}
              onChange={(e) => setForm((p) => ({ ...p, gateway_id: e.target.value }))}
              disabled={isEditing}
            >
              <option value="ALL">🌐 All Gateways (Global Power-Up / Shutdown)</option>
              {gateways.map((gw) => (
                <option key={gw.id} value={gw.id}>
                  📡 {gw.name} ({gw.ip})
                </option>
              ))}
            </select>
          </div>
          {/* Action */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Action</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, action: 'ON' }))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  form.action === 'ON'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                ⚡ Power ON
              </button>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, action: 'OFF' }))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  form.action === 'OFF'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                🔌 Shutdown
              </button>
            </div>
          </div>

          {/* Time */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Time (24h)</label>
            <input
              type="time"
              className="input-field font-mono text-center !text-lg tracking-widest"
              value={form.time}
              onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
              required
            />
          </div>

          {/* Days */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Active Days</label>
            <div className="flex gap-1.5">
              {ALL_DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                    form.days.includes(day)
                      ? 'bg-knx-accent/20 text-knx-accent border border-knx-accent/40'
                      : 'bg-white/5 text-gray-500 border border-transparent hover:bg-white/10 hover:text-gray-300'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
            {/* Quick presets */}
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, days: [...ALL_DAYS] }))}
                className="text-[10px] text-gray-500 hover:text-knx-accent transition-colors"
              >
                Every day
              </button>
              <span className="text-gray-600 text-[10px]">·</span>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] }))}
                className="text-[10px] text-gray-500 hover:text-knx-accent transition-colors"
              >
                Weekdays
              </button>
              <span className="text-gray-600 text-[10px]">·</span>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, days: ['Sat', 'Sun'] }))}
                className="text-[10px] text-gray-500 hover:text-knx-accent transition-colors"
              >
                Weekends
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/25 px-4 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isEditing ? 'Update Schedule' : 'Create Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
