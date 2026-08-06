import { Server, Trash2, ChevronRight, Clock } from 'lucide-react';
import StatusBadge from './StatusBadge';

/**
 * GatewayCard — displays a single gateway's info with click-to-select.
 */
export default function GatewayCard({ gateway, isSelected, onSelect, onDelete, scheduleCount = 0 }) {
  const relayCount = gateway.relay_addresses?.length || 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(gateway.id)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(gateway.id)}
      className={`glass-card-hover w-full text-left p-5 group relative cursor-pointer ${
        isSelected ? 'ring-2 ring-knx-accent/60 border-knx-accent/40' : ''
      }`}
    >
      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(gateway.id);
        }}
        className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-500
                   hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
        title="Remove gateway"
      >
        <Trash2 size={14} />
      </button>

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 rounded-xl bg-knx-accent/10 text-knx-accent">
          <Server size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate">{gateway.name}</h3>
          <p className="font-mono text-xs text-gray-400 mt-0.5">
            {gateway.ip}:{gateway.port}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StatusBadge status="unknown" />
          <span className="text-xs text-gray-500">
            {relayCount} relay{relayCount !== 1 ? 's' : ''}
          </span>
          {scheduleCount > 0 && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Clock size={11} />
              {scheduleCount}
            </span>
          )}
        </div>
        <ChevronRight
          size={16}
          className={`text-gray-600 transition-transform duration-200 ${
            isSelected ? 'text-knx-accent translate-x-0.5' : 'group-hover:translate-x-0.5'
          }`}
        />
      </div>
    </div>
  );
}
