import { cn } from '../../lib/cn';
import {
  logoHorizontal,
  logoStacked,
  type MarkGeometry,
} from '../../assets/brand/marks';

export type WordmarkVariant = 'horizontal' | 'stacked';

const GEOMETRY: Record<WordmarkVariant, MarkGeometry> = {
  horizontal: logoHorizontal,
  stacked: logoStacked,
};

export interface WordmarkProps {
  variant?: WordmarkVariant;
  /** Accessible name. Pass `null` when a visible heading already says it. */
  title?: string | null;
  className?: string;
}

/**
 * The full lockup. Letterforms take the surrounding text colour, the slash
 * inside the mark stays gold — that gold is part of the artwork and does not
 * count against a screen's ration.
 *
 * Sized from CSS. `horizontal` wants a height; `stacked` wants a width.
 */
export function Wordmark({
  variant = 'horizontal',
  title = "You've Got Style",
  className,
}: WordmarkProps) {
  const geometry = GEOMETRY[variant];

  return (
    <svg
      viewBox={geometry.viewBox}
      fill="none"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
      className={cn(
        'block',
        variant === 'horizontal' ? 'h-6 w-auto' : 'h-auto w-32',
        className,
      )}
    >
      {title ? <title>{title}</title> : null}
      {geometry.paths.map((path, index) => (
        <path
          key={index}
          d={path.d}
          className={path.role === 'accent' ? 'fill-gold' : 'fill-current'}
        />
      ))}
    </svg>
  );
}
