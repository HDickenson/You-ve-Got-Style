import { cn } from '../../lib/cn';
import type { ElementProps } from '../../lib/props';

export type BadgeVariant = 'outline' | 'solid' | 'gold';

const VARIANT: Record<BadgeVariant, string> = {
  outline: 'border-rule text-fg-muted',
  solid: 'border-transparent bg-fg text-surface',
  /** Rationed: a completed intelligence result or an active selection. */
  gold: 'border-transparent bg-gold text-on-gold',
};

export interface BadgeProps extends ElementProps {
  variant?: BadgeVariant;
}

export function Badge({ variant = 'outline', className, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-3 py-1',
        'text-eyebrow font-medium uppercase whitespace-nowrap',
        VARIANT[variant],
        className,
      )}
      {...props}
    />
  );
}
