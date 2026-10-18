import type { ItemStatus } from '../features/catalog/types';

interface Props {
  status: ItemStatus;
  label: string;
}

export function StatusBadge({ status, label }: Props) {
  if (status === 'active' || !label) return null;
  return (
    <span className="status-badge" data-status={status}>
      {label}
    </span>
  );
}
