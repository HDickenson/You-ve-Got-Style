import { cn } from '../../lib/cn';
import type { ElementProps } from '../../lib/props';

/**
 * Price binds the 15px price role to tabular figures, because the token cannot:
 * Tailwind v4 has no `--text-*--font-variant-numeric` key, so `text-price` on
 * its own gives proportional digits and a column of prices that never lines up.
 *
 * Sans, always. A price is information, never an editorial moment.
 */
export function Price({ className, ...props }: ElementProps) {
  return (
    <span
      data-slot="price"
      className={cn('text-price tabular text-fg', className)}
      {...props}
    />
  );
}
