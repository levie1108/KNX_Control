import { Plus, RefreshCw } from 'lucide-react';
import GatewayCard from './GatewayCard';

/**
 * GatewayOverview — grid of all registered gateways with add/refresh actions.
 */
export default function GatewayOverview({
  gateways,
  statuses,
  loading,
  selectedId,
  onSelect,
  onDelete,
  onAddClick,
  onRefresh,
  scheduleCounts,
}) {
  return (
    <section>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-white">Gateways</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {gateways.length} registered gateway{gateways.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={onRefresh} className="btn-ghost flex items-center gap-1.5" title="Refresh">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button onClick={onAddClick} className="btn-primary flex items-center gap-1.5">
            <Plus size={15} />
            <span>Add Gateway</span>
          </button>
        </div>
      </div>

      {/* Gateway grid */}
      {loading && gateways.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <RefreshCw size={24} className="animate-spin text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">Loading gateways…</p>
        </div>
      ) : gateways.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-4xl mb-3">📡</div>
          <h3 className="text-white font-medium mb-1">No Gateways Registered</h3>
          <p className="text-gray-400 text-sm mb-4">Add your first KNX IP gateway to get started.</p>
          <button onClick={onAddClick} className="btn-primary inline-flex items-center gap-1.5">
            <Plus size={15} />
            Add Gateway
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gateways.map((gw) => (
            <GatewayCard
              key={gw.id}
              gateway={gw}
              isSelected={selectedId === gw.id}
              onSelect={onSelect}
              onDelete={onDelete}
              scheduleCount={scheduleCounts?.[gw.id] || 0}
              status={statuses?.[gw.id] || 'pending'}
            />
          ))}
        </div>
      )}
    </section>
  );
}
