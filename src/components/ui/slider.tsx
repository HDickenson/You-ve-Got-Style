import { cn } from '../../lib/cn';
import type { ElementProps } from '../../lib/props';

export interface SliderProps extends ElementProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onValueChange: (value: number) => void;
}

/**
 * A native range input underneath, so keyboard, arrow keys, Home/End and
 * screen-reader value announcement come for free and correctly.
 *
 * The filled portion is the ground's own ink, not gold — dragging a value is
 * routine, and gold is reserved for what has actually been chosen.
 */
export function Slider({
  value,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  disabled,
  className,
  style,
  ...props
}: SliderProps) {
  const span = max - min || 1;
  const fill = `${((value - min) / span) * 100}%`;

  // The caller's style is merged rather than left to win. Spread through
  // `...props` it landed after this one and silently erased the track fill.
  const trackStyle = { ...style, '--slider-fill': fill };

  return (
    <div
      data-slot="slider"
      className={cn('flex h-11 w-full items-center', className)}
    >
      <input
        data-slot="slider-input"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onValueChange(Number(event.target.value))}
        style={trackStyle}
        className={cn(
          'h-6 w-full cursor-pointer appearance-none bg-transparent',
          'disabled:pointer-events-none disabled:opacity-40',
          // Track — filled to --slider-fill in the ground's ink, rule beyond it.
          '[&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-full',
          '[&::-webkit-slider-runnable-track]:bg-[linear-gradient(to_right,var(--color-fg)_0_var(--slider-fill),var(--color-rule)_var(--slider-fill)_100%)]',
          '[&::-moz-range-track]:h-1 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-rule',
          '[&::-moz-range-progress]:h-1 [&::-moz-range-progress]:rounded-full [&::-moz-range-progress]:bg-fg',
          // Thumb — 24px, optically centred on the 4px track.
          '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-6',
          '[&::-webkit-slider-thumb]:mt-[-0.625rem] [&::-webkit-slider-thumb]:rounded-full',
          '[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-surface',
          '[&::-webkit-slider-thumb]:bg-fg',
          '[&::-moz-range-thumb]:size-6 [&::-moz-range-thumb]:rounded-full',
          '[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-surface',
          '[&::-moz-range-thumb]:bg-fg',
        )}
        {...props}
      />
    </div>
  );
}
