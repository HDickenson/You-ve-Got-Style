import { cn } from '../../lib/cn';
import type { ElementProps } from '../../lib/props';

export interface SwitchProps extends ElementProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

/**
 * On is the ground's own ink, not gold. A guardrails screen carries six of
 * these with five on by default, and six gold blobs is wallpaper — gold stays
 * for singular selection. The ink track also clears the 3:1 that a state
 * indicator owes its background, which gold on cream (2.01:1) does not.
 *
 * The hit area is 48×44 even though the track is smaller: touch targets clear
 * 44px at every size, and a tablet has no hover to compensate.
 */
export function Switch({
  checked,
  onCheckedChange,
  disabled,
  className,
  ...props
}: SwitchProps) {
  return (
    <button
      data-slot="switch"
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'group inline-flex h-11 w-12 shrink-0 items-center justify-center rounded-control',
        'disabled:pointer-events-none disabled:opacity-40',
        className,
      )}
      {...props}
    >
      <span
        data-slot="switch-track"
        className={cn(
          'relative block h-6 w-11 rounded-full border',
          'transition-colors duration-shift ease-shift',
          checked ? 'border-transparent bg-fg' : 'border-rule bg-fg/10',
        )}
      >
        <span
          data-slot="switch-thumb"
          className={cn(
            'absolute top-0.5 left-0.5 block size-5 rounded-full',
            'transition-transform duration-shift ease-shift',
            checked ? 'translate-x-5 bg-surface' : 'translate-x-0 bg-fg',
          )}
        />
      </span>
    </button>
  );
}
