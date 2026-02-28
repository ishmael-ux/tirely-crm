import { cn } from '@/lib/utils';

type Status = 'scheduled' | 'in-bay' | 'completed' | 'cancelled' |
              'pending' | 'paid' | 'overdue' | 'draft' | 'sent' | 'simulated' | string;

const STATUS_CLASSES: Record<string, string> = {
  scheduled: 'bg-status-blue-light text-status-blue',
  'in-bay':  'bg-status-yellow-light text-status-yellow',
  completed: 'bg-status-green-light text-status-green',
  cancelled: 'bg-muted text-text2',
  paid:      'bg-status-green-light text-status-green',
  pending:   'bg-status-yellow-light text-status-yellow',
  overdue:   'bg-brand-light text-brand',
  draft:     'bg-muted text-text2',
  sent:      'bg-status-blue-light text-status-blue',
  simulated: 'bg-muted text-text2',
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const classes = STATUS_CLASSES[status] ?? 'bg-muted text-text2';
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize',
        classes,
        className,
      )}
    >
      {status}
    </span>
  );
}
