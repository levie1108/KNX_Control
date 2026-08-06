/**
 * StatusBadge — small pill showing online/offline/unknown status.
 */
export default function StatusBadge({ status = 'unknown' }) {
  const styles = {
    online: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    offline: 'bg-red-500/15 text-red-400 border-red-500/25',
    unknown: 'bg-gray-500/15 text-gray-400 border-gray-500/25',
    pending: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  };

  const dotClass = {
    online: 'status-dot-on',
    offline: 'status-dot-off',
    unknown: 'status-dot-unknown',
    pending: 'status-dot-pending',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.unknown}`}
    >
      <span className={dotClass[status] || dotClass.unknown} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
