import { cn } from '@/lib/utils';

interface StockRingProps {
  quantity: number;
  minStock: number;
  className?: string;
}

export default function StockRing({ quantity, minStock, className }: StockRingProps) {
  const isOut = quantity === 0;
  const isLow = quantity > 0 && quantity <= minStock;

  return (
    <span
      className={cn(
        'inline-block w-2.5 h-2.5 rounded-full flex-shrink-0',
        isOut ? 'bg-brand' : isLow ? 'bg-status-yellow' : 'bg-status-green',
        className,
      )}
      title={isOut ? 'Out of stock' : isLow ? 'Low stock' : 'In stock'}
    />
  );
}
