const colorMap: Record<string, string> = {
  // Stock status
  ok: 'bg-green-100 text-green-700',
  low: 'bg-yellow-100 text-yellow-700',
  out: 'bg-red-100 text-red-700',
  // Order/transfer status
  draft: 'bg-gray-100 text-gray-700',
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  ordered: 'bg-indigo-100 text-indigo-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-indigo-100 text-indigo-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  partial: 'bg-orange-100 text-orange-700',
  received: 'bg-green-100 text-green-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  rejected: 'bg-red-100 text-red-700',
  refunded: 'bg-purple-100 text-purple-700',
  in_transit: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-blue-100 text-blue-700',
  planned: 'bg-gray-100 text-gray-700',
  // Movement types
  in: 'bg-green-100 text-green-700',
  out_movement: 'bg-red-100 text-red-700',
  adjustment: 'bg-yellow-100 text-yellow-700',
  transfer: 'bg-blue-100 text-blue-700',
  // Adjustment types
  correction: 'bg-blue-100 text-blue-700',
  damage: 'bg-red-100 text-red-700',
  write_off: 'bg-red-100 text-red-700',
  found: 'bg-green-100 text-green-700',
  return: 'bg-purple-100 text-purple-700',
  expiry: 'bg-orange-100 text-orange-700',
};

interface StatusBadgeProps {
  status: string;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const colors = colorMap[status.toLowerCase()] || 'bg-gray-100 text-gray-700';
  const displayLabel = label || status.replace(/_/g, ' ');

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${colors}`}>
      {displayLabel}
    </span>
  );
}
