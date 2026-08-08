import { cn } from '../../lib/cn';
import type { ElementProps } from '../../lib/props';

/**
 * A quiet placeholder in the ground's own ink. It breathes; it does not
 * shimmer, and it must not outlast the load.
 *
 * `animate-breath` rather than Tailwind's `animate-pulse`: pulse ships its own
 * 2s cubic-bezier(0.4, 0, 0.6, 1), which would be the only curve in the build
 * that is not one of ours.
 */
export function Skeleton({ className, ...props }: ElementProps) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        'rounded-control bg-fg/10',
        'motion-safe:animate-breath motion-reduce:animate-none',
        className,
      )}
      {...props}
    />
  );
}
