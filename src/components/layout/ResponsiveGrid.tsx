import { cn } from '../../lib/cn';
import type { ElementProps } from '../../lib/props';
import { GAP, type GapStep } from './Stack';

export interface ResponsiveGridProps extends ElementProps {
  gap?: GapStep;
  /**
   * Two columns on tablet landscape instead of three — for cards that carry an
   * editorial image and would lose their proportion at a third of the width.
   */
  maxColumns?: 2 | 3;
}

/**
 * One column on phone, two at md:, three at lg:. Extra tablet space becomes
 * another column, never a wider card.
 */
export function ResponsiveGrid({
  gap = 24,
  maxColumns = 3,
  className,
  ...props
}: ResponsiveGridProps) {
  return (
    <div
      data-slot="responsive-grid"
      className={cn(
        'grid grid-cols-1 md:grid-cols-2',
        maxColumns === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2',
        GAP[gap],
        className,
      )}
      {...props}
    />
  );
}
