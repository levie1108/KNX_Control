import { useState, useEffect, useCallback, useMemo } from 'react';
import { Clock, Plus, Pencil, Trash2, Zap, ZapOff, RefreshCw } from 'lucide-react';
import {
  fetchSchedules,
  createSchedule,
  updateSchedule,
  toggleSchedule,
  deleteSchedule,
} from '../api/client';
import ScheduleModal from './ScheduleModal';

/**
 * SchedulePanel — shows and manages schedules for a selected gateway.
 */
export default function SchedulePanel({ gateway, gateways = [] }) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // If a gateway is selected, fetch schedules for it (which includes global 'ALL' schedules)
      // Otherwise fetch all schedules across all gateways
      const data = await fetchSchedules(gateway ? gateway.id : null);
      setSchedules(data);
    } catch {
      // silent — schedules are non-critical
    } finally {
      setLoading(false);
    }
  }, [gateway]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (data) => {
    await createSchedule(data);
    await load();
  };

  const handleUpdate = async (data) => {
    await updateSchedule(editingSchedule.id, data);
    setEditingSchedule(null);
    await load();
  };

  const handleToggle = async (sched) => {
    await toggleSchedule(sched.id, !sched.enabled);
    await load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this schedule?')) return;
    await deleteSchedule(id);
    await load();
  };

  const handleEdit = (sched) => {
    setEditingSchedule(sched);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSchedule(null);
  };

  const gatewayNameMap = useMemo(() => {
    const map = { ALL: 'Global (All Gateways)' };
    gateways.forEach((g) => {
      map[g.id] = g.name;
    });
    return map;
  }, [gateways]);

  return (
    <section>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">
            {gateway ? `${gateway.name} — Schedules` : 'All Schedules'}
          </h2>
          <p className="text-sm text-gray-400 font-mono">
            {gateway ? `${gateway.ip}:${gateway.port} · ` : ''}
            {schedules.length} schedule{schedules.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="btn-ghost flex items-center gap-1.5"
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => { setEditingSchedule(null); setShowModal(true); }}
            className="btn-primary flex items-center gap-1.5"
          >
            <Plus size={15} />
            <span>Add Schedule</span>
          </button>
        </div>
      </div>

      {/* Schedule list */}
      {loading && schedules.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <RefreshCw size={24} className="animate-spin text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">Loading schedules…</p>
        </div>
      ) : schedules.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-4xl mb-3">⏰</div>
          <h3 className="text-white font-medium mb-1">No Schedules Configured</h3>
          <p className="text-gray-400 text-sm mb-4">
            Add a scheduled power-on or shutdown for all gateways or a specific gateway.
          </p>
          <button
            onClick={() => { setEditingSchedule(null); setShowModal(true); }}
            className="btn-primary inline-flex items-center gap-1.5"
          >
            <Plus size={15} />
            Add Schedule
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map((sched) => {
            const isGlobal = sched.gateway_id === 'ALL';
            const targetName = gatewayNameMap[sched.gateway_id] || sched.gateway_id;

            return (
              <div
                key={sched.id}
                className={`glass-card p-4 flex items-center justify-between gap-4 transition-all duration-200 ${
                  !sched.enabled ? 'opacity-50' : ''
                } ${isGlobal ? 'border-blue-500/30' : ''}`}
              >
                {/* Left: action icon + time + days + scope */}
                <div className="flex items-center gap-4 min-w-0">
                  {/* Action badge */}
                  <div
                    className={`p-2.5 rounded-xl flex-shrink-0 ${
                      sched.action === 'ON'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}
                  >
                    {sched.action === 'ON' ? <Zap size={20} /> : <ZapOff size={20} />}
                  </div>

                  {/* Time + info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xl font-mono font-bold text-white tracking-wider">
                        {sched.time}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          sched.action === 'ON'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-red-500/15 text-red-400'
                        }`}
                      >
                        {sched.action === 'ON' ? 'Power ON' : 'Shutdown'}
                      </span>
                      {/* Scope Badge */}
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isGlobal
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-white/10 text-gray-300'
                        }`}
                      >
                        {isGlobal ? '🌐 Global (All Gateways)' : `📡 ${targetName}`}
                      </span>
                    </div>

                    <div className="flex gap-1 mt-2">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                        <span
                          key={day}
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            sched.days.includes(day)
                              ? 'bg-knx-accent/15 text-knx-accent'
                              : 'bg-white/5 text-gray-600'
                          }`}
                        >
                          {day}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: toggle + edit + delete */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Enable/disable toggle */}
                  <button
                    onClick={() => handleToggle(sched)}
                    className="toggle-track flex-shrink-0"
                    data-state={sched.enabled ? 'on' : 'off'}
                    title={sched.enabled ? 'Disable schedule' : 'Enable schedule'}
                  >
                    <div className="toggle-thumb" />
                  </button>
                  <button
                    onClick={() => handleEdit(sched)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-knx-accent hover:bg-knx-accent/10 transition-colors"
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(sched.id)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <ScheduleModal
          gateways={gateways}
          defaultGatewayId={gateway ? gateway.id : 'ALL'}
          schedule={editingSchedule}
          onClose={handleCloseModal}
          onSave={editingSchedule ? handleUpdate : handleCreate}
        />
      )}
    </section>
  );
}
