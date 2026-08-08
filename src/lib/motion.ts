/**
 * The four named transitions, in the units the `motion` package wants.
 * These mirror the `--duration-*` / `--ease-*` tokens in index.css exactly, so
 * a JS-driven animation and a CSS-driven one are the same movement.
 *
 * Reveal · Place · Shift · Resolve. There is no fifth. No bounce, no elastic,
 * no overshoot — every curve decelerates and stops.
 */

type Cubic = [number, number, number, number];

export const EASE: Record<TransitionName, Cubic> = {
  reveal: [0.16, 1, 0.3, 1],
  place: [0.22, 0.61, 0.36, 1],
  shift: [0.33, 0, 0.15, 1],
  resolve: [0.16, 1, 0.3, 1],
};

/** Seconds, matching --duration-* in index.css. */
export const DURATION: Record<TransitionName, number> = {
  reveal: 0.42,
  place: 0.34,
  shift: 0.28,
  resolve: 0.36,
};

export type TransitionName = 'reveal' | 'place' | 'shift' | 'resolve';

export interface NamedTransition {
  duration: number;
  ease: Cubic;
}

/**
 * `transition('place')` → the Place transition.
 * `transition('place', true)` → stillness, for readers who asked for it.
 */
export function transition(
  name: TransitionName,
  reduced?: boolean | null,
): NamedTransition {
  return {
    duration: reduced ? 0 : DURATION[name],
    ease: EASE[name],
  };
}
