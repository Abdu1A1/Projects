import { Badge } from '@/components/ui/badge';
import { FlagType, FLAG_CONFIG } from '@/types';

interface FlagBadgeProps {
  flag: FlagType;
  size?: 'sm' | 'md';
}

export function FlagBadge({ flag, size = 'sm' }: FlagBadgeProps) {
  const config = FLAG_CONFIG[flag];
  if (!config) return null;

  return (
    <Badge
      variant="outline"
      className={`${config.color} ${config.bgColor} border-0 font-medium ${
        size === 'sm' ? 'text-xs px-1.5 py-0' : 'text-sm px-2 py-0.5'
      }`}
      title={config.description}
    >
      {config.label}
    </Badge>
  );
}
