import { useState, useMemo, useEffect, useCallback } from 'react';
import { Activity, Server, Zap, Clock } from 'lucide-react';
import { useGateways } from './hooks/useGateways';
import GatewayOverview from './components/GatewayOverview';
import RelayMatrix from './components/RelayMatrix';
import MasterActions from './components/MasterActions';
import AddGatewayModal from './components/AddGatewayModal';
import SchedulePanel from './components/SchedulePanel';
import { fetchScheduleCounts } from './api/client';

const NAV_ITEMS = [
  { id: 'overview', label: 'Gateways', icon: Server },
  //{ id: 'control', label: 'Relay Control', icon: Activity },
  { id: 'schedules', label: 'Schedules', icon: Clock },
  { id: 'master', label: 'Master Actions', icon: Zap },
];

export default function App() {
  const { gateways, statuses, loading, error, reload, addGateway, removeGateway } = useGateways();
  const [view, setView] = useState('overview');
  const [selectedGatewayId, setSelectedGatewayId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [scheduleCounts, setScheduleCounts] = useState({});

  const loadScheduleCounts = useCallback(async () => {
    try {
      const counts = await fetchScheduleCounts();
      setScheduleCounts(counts);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    loadScheduleCounts();
  }, [loadScheduleCounts, gateways]);

  const selectedGateway = useMemo(
    () => gateways.find((g) => g.id === selectedGatewayId) || null,
    [gateways, selectedGatewayId],
  );

  const handleSelectGateway = (id) => {
    setSelectedGatewayId(id);
    setView('control');
  };

  const handleDeleteGateway = async (id) => {
    if (!window.confirm(`Delete gateway "${id}"? This cannot be undone.`)) return;
    await removeGateway(id);
    if (selectedGatewayId === id) setSelectedGatewayId(null);
  };

  return (
    <div className="min-h-screen grid-pattern">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-knx-bg/80 border-b border-knx-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500
                              flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Activity size={16} className="text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white leading-tight">KNX Control</h1>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider leading-tight">
                  Multi-Gateway Engine
                </p>
              </div>
            </div>

            {/* Nav */}
            <nav className="flex gap-1">
              {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setView(id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    view === id
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={15} />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Global Error */}
        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/25 px-4 py-3 text-sm text-red-400">
            Failed to load gateways: {error}
          </div>
        )}

        {/* Views */}
        {view === 'overview' && (
          <GatewayOverview
            gateways={gateways}
            statuses={statuses}
            loading={loading}
            selectedId={selectedGatewayId}
            onSelect={handleSelectGateway}
            onDelete={handleDeleteGateway}
            onAddClick={() => setShowAddModal(true)}
            onRefresh={reload}
            scheduleCounts={scheduleCounts}
          />
        )}

        {view === 'control' && (
          <>
            {/* Gateway selector (compact) */}
            {gateways.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {gateways.map((gw) => (
                  <button
                    key={gw.id}
                    onClick={() => setSelectedGatewayId(gw.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                      selectedGatewayId === gw.id
                        ? 'bg-knx-accent text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {gw.name}
                  </button>
                ))}
              </div>
            )}
            <RelayMatrix gateway={selectedGateway} />
          </>
        )}

        {view === 'schedules' && (
          <>
            {/* Gateway selector (compact) with All option */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedGatewayId(null)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                  selectedGatewayId === null
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                🌐 All Gateways
              </button>
              {gateways.map((gw) => (
                <button
                  key={gw.id}
                  onClick={() => setSelectedGatewayId(gw.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                    selectedGatewayId === gw.id
                      ? 'bg-knx-accent text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  📡 {gw.name}
                </button>
              ))}
            </div>
            <SchedulePanel gateway={selectedGateway} gateways={gateways} />
          </>
        )}

        {view === 'master' && (
          <MasterActions gatewayCount={gateways.length} />
        )}
      </main>

      {/* Add Gateway Modal */}
      {showAddModal && (
        <AddGatewayModal
          onClose={() => setShowAddModal(false)}
          onSave={addGateway}
        />
      )}
    </div>
  );
}
