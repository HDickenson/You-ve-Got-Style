import { cn } from '../../lib/cn';
import type { ElementProps } from '../../lib/props';

/**
 * A card is a raised plane on the current ground: white on cream, a warm
 * near-black on onyx. The border is a rule, never gold — an ordinary card
 * border is on the forbidden list.
 *
 * Interior padding steps 24 → 32 with the page gutter, so a card does not stay
 * phone-scaled inside a 1024px layout.
 */
export function Card({ className, ...props }: ElementProps) {
  return (
    <div
      data-slot="card"
      className={cn(
        'rounded-card border border-rule bg-surface-raised text-fg',
        'overflow-hidden',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: ElementProps) {
  return (
    <div
      data-slot="card-header"
      className={cn('flex flex-col gap-2 p-6 md:p-8', className)}
      {...props}
    />
  );
}

/** Sans, always. The serif is for occasion titles and reveals, not card chrome. */
export function CardTitle({ className, ...props }: ElementProps) {
  return (
    <h3
      data-slot="card-title"
      className={cn('text-screen font-medium text-fg', className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: ElementProps) {
  return (
    <p
      data-slot="card-description"
      className={cn('max-w-measure text-body text-fg-muted', className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: ElementProps) {
  return (
    <div
      data-slot="card-content"
      className={cn('px-6 pb-6 md:px-8 md:pb-8', className)}
      {...props}
    />
  );
}

export function CardFooter({ className, ...props }: ElementProps) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        'flex flex-wrap items-center gap-3 border-t border-rule px-6 py-4 md:px-8',
        className,
      )}
      {...props}
    />
  );
}
