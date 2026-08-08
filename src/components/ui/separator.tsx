import { cn } from '../../lib/cn';
import type { ElementProps } from '../../lib/props';

export interface SeparatorProps extends ElementProps {
  orientation?: 'horizontal' | 'vertical';
}

/** A hairline in the rule colour. Never gold — decorative rules are forbidden. */
export function Separator({
  orientation = 'horizontal',
  className,
  ...props
}: SeparatorProps) {
  return (
    <div
      data-slot="separator"
      role="separator"
      aria-orientation={orientation}
      className={cn(
        'shrink-0 bg-rule',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className,
      )}
      {...props}
    />
  );
}
