import { cn } from '../../lib/cn';
import type { ElementProps } from '../../lib/props';

/**
 * Gaps are given in pixels and only the eight permitted steps type-check —
 * `gap={20}` is a compile error, which is the point.
 */
export const GAP = {
  4: 'gap-1',
  8: 'gap-2',
  12: 'gap-3',
  16: 'gap-4',
  24: 'gap-6',
  32: 'gap-8',
  48: 'gap-12',
  64: 'gap-16',
} as const;

export type GapStep = keyof typeof GAP;

const ALIGN = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
} as const;

export interface StackProps extends ElementProps {
  as?: any;
  gap?: GapStep;
  align?: keyof typeof ALIGN;
}

/** Vertical rhythm. Flex and gap only — no fixed heights that break in landscape. */
export function Stack({
  as: Component = 'div',
  gap = 16,
  align = 'stretch',
  className,
  ...props
}: StackProps) {
  return (
    <Component
      data-slot="stack"
      className={cn('flex min-w-0 flex-col', GAP[gap], ALIGN[align], className)}
      {...props}
    />
  );
}
