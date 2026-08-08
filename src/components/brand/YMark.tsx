import { cn } from '../../lib/cn';
import { symbolY } from '../../assets/brand/marks';

export type YMarkTone = 'current' | 'onyx' | 'white' | 'gold';

const TONE_CLASS: Record<YMarkTone, string> = {
  current: '',
  onyx: 'text-onyx',
  white: 'text-white',
  gold: 'text-gold',
};

export interface YMarkProps {
  /**
   * Which colour the mark takes — nothing else. `current` inherits the
   * surrounding text colour, which is what you want on a ground that inverts.
   * The slash stays gold at every tone: it is part of the artwork and does not
   * count against a screen's gold ration.
   */
  tone?: YMarkTone;
  /**
   * Accessible name. Omit it wherever the mark sits beside the brand name
   * already — a second announcement of "You've Got Style" is noise.
   */
  title?: string;
  className?: string;
}

/**
 * The Y. Never redrawn, never an emoji, never a stand-in icon — one geometry,
 * the extracted brand artwork, at one aspect ratio for every tone.
 *
 * Size it from CSS; there is deliberately no width or height attribute to
 * fight with. `h-5` (20px) is the floor — below that the counter closes up and
 * the slash mushes into the stem.
 */
export function YMark({ tone = 'current', title, className }: YMarkProps) {
  return (
    <svg
      viewBox={symbolY.viewBox}
      fill="none"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
      className={cn('block h-6 w-auto', TONE_CLASS[tone], className)}
    >
      {title ? <title>{title}</title> : null}
      {symbolY.paths.map((path, index) => (
        <path
          key={index}
          d={path.d}
          className={path.role === 'accent' ? 'fill-gold' : 'fill-current'}
        />
      ))}
    </svg>
  );
}
