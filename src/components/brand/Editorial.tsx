import { useEffect } from 'react';
import { cn } from '../../lib/cn';
import type { ElementProps } from '../../lib/props';

/**
 * The editorial voice is a component, not a class, because the class does not
 * work: `--text-display` carries size, leading and tracking, and Tailwind v4
 * has no `--text-*--font-family` key — so `text-display` alone renders 40px of
 * Instrument Sans and looks entirely plausible. Pairing the token with
 * `font-serif` here makes this the only route to the serif, which is also how
 * a button, a price or a setting is kept from reaching it.
 */

let onScreen = 0;

/** One editorial moment per screen. Two, and neither one is a moment. */
function useEditorialVoice(role: string) {
  useEffect(() => {
    onScreen += 1;
    if (onScreen > 1) {
      console.warn(
        `[YGS] ${onScreen} editorial voices are mounted at once (${role}). ` +
          'The contract allows one per screen — the serif stops being an ' +
          'event the moment it repeats.',
      );
    }
    return () => {
      onScreen -= 1;
    };
  }, [role]);
}

export interface EditorialProps extends ElementProps {
  as?: any;
}

/**
 * The reveal moment: 40px on phone, 56 at md:, 64 at lg:. Display is the only
 * type in the system that grows with the viewport.
 */
export function Display({
  as: Component = 'h1',
  className,
  ...props
}: EditorialProps) {
  useEditorialVoice('Display');

  return (
    <Component
      data-slot="display"
      className={cn(
        'font-serif font-normal text-fg',
        'text-display md:text-display-md lg:text-display-lg',
        'max-w-measure',
        className,
      )}
      {...props}
    />
  );
}

/** The occasion: serif italic, 20px on phone, 28 at md:. */
export function OccasionTitle({
  as: Component = 'h2',
  className,
  ...props
}: EditorialProps) {
  useEditorialVoice('OccasionTitle');

  return (
    <Component
      data-slot="occasion-title"
      className={cn(
        'font-serif font-normal italic text-fg',
        'text-occasion md:text-occasion-md',
        'max-w-measure',
        className,
      )}
      {...props}
    />
  );
}
