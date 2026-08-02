import { Badge } from '@/components/ui/badge';
import { RotateCcw } from 'lucide-react';

interface ProductBadgeProps {
  isPreviouslyOrdered: boolean;
  className?: string;
}

export function ProductBadge({ isPreviouslyOrdered, className = "" }: ProductBadgeProps) {
  if (!isPreviouslyOrdered) return null;

  return (
    <Badge 
      variant="secondary" 
      className={`absolute top-2 right-2 bg-green-100 text-green-800 border-green-300 flex items-center gap-1 text-xs ${className}`}
    >
      <RotateCcw className="h-3 w-3" />
      Previously Ordered
    </Badge>
  );
}