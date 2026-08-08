import { cn } from '../../lib/cn';
import type { ElementProps } from '../../lib/props';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'selected';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

/**
 * Variants are ground-relative: `primary` inverts the ground rather than
 * naming a colour, so the same button is white-on-onyx in theatre and
 * ink-on-cream in conversation without the caller thinking about it.
 *
 * `selected` is the only gold variant and it is rationed — active selection,
 * a completed intelligence result, the signature moment on a reveal. Never a
 * routine confirm. It carries an ink rule because gold on cream is 2.01:1:
 * unbordered, the one thing gold exists to say would be the least legible
 * element on a conversation screen. The rule, not the fill, does the 3:1.
 */
const VARIANT: Record<ButtonVariant, string> = {
  primary:
    'bg-fg text-surface border border-transparent hoverable:hover:opacity-90',
  secondary:
    'bg-transparent text-fg border border-rule hoverable:hover:border-fg',
  ghost:
    'bg-transparent text-fg-muted border border-transparent hoverable:hover:text-fg',
  selected: 'bg-gold text-on-gold border border-fg hoverable:hover:opacity-90',
};

/** Every size clears 44px in both directions. Tablets have no hover to fall back on. */
const SIZE: Record<ButtonSize, string> = {
  sm: 'h-11 px-4 gap-2',
  md: 'h-12 px-6 gap-2',
  lg: 'h-14 px-8 gap-3',
  icon: 'size-11 p-0',
};

export interface ButtonProps extends ElementProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      data-slot="button"
      type={type}
      className={cn(
        'inline-flex items-center justify-center select-none',
        'text-control font-medium uppercase whitespace-nowrap',
        // Only the icon button refuses to shrink. A labelled button that
        // cannot shrink and cannot wrap silently overflows a capped action
        // row — and `body { overflow-x: hidden }` would hide the break.
        size === 'icon' ? 'shrink-0 rounded-full' : 'rounded-control',
        'transition-[color,background-color,border-color,opacity] duration-shift ease-shift',
        'motion-safe:active:scale-[0.98]',
        'disabled:pointer-events-none disabled:opacity-40',
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...props}
    />
  );
}
