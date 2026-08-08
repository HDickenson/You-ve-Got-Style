import { cn } from '../../lib/cn';
import type { ElementProps } from '../../lib/props';

export interface ActionRowProps extends ElementProps {
  align?: 'start' | 'center' | 'end';
}

const ALIGN = {
  start: 'mr-auto md:justify-start',
  center: 'mx-auto md:justify-center',
  end: 'ml-auto md:justify-end',
} as const;

/**
 * Actions stack full-width under the thumb on phone and sit in a capped row
 * from md: — three buttons must never spread across a tablet.
 *
 * The row wraps: three md buttons (h-12 px-6, wide-tracked uppercase labels)
 * exceed the 480px cap, and without `flex-wrap` they would overflow it into
 * the page's `overflow-x: hidden` and disappear rather than complain.
 *
 * Three is the ceiling for a screen, not a target.
 */
export function ActionRow({
  align = 'center',
  className,
  children,
  ...props
}: ActionRowProps) {
  return (
    <div
      data-slot="action-row"
      className={cn(
        'flex w-full max-w-action flex-col gap-3',
        'md:flex-row md:flex-wrap md:items-center',
        ALIGN[align],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
