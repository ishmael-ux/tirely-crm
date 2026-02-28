import { getInitials, avatarColor } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface CustomerAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'w-7 h-7 text-[11px]',
  md: 'w-9 h-9 text-[13px]',
  lg: 'w-11 h-11 text-[15px]',
};

export default function CustomerAvatar({ name, size = 'md', className }: CustomerAvatarProps) {
  const initials = getInitials(name);
  const color = avatarColor(name);

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0',
        SIZE_CLASSES[size],
        className,
      )}
      style={{ backgroundColor: color }}
      title={name}
    >
      {initials}
    </div>
  );
}
