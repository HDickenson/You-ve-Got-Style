import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { transition } from '../../lib/motion';
import type { Renderable } from '../../lib/props';

export type OverlayPlacement = 'center' | 'bottom' | 'left' | 'responsive';
export type OverlayGround = 'cream' | 'sand' | 'onyx' | 'forest';

const FOCUSABLE = [
  'a[href]',
  'button:not(:disabled)',
  'input:not(:disabled)',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

let lockCount = 0;
/** Captured once, when the first overlay opens — never per-overlay. */
let overflowBeforeLock = '';

/**
 * While anything is open the page behind it neither scrolls nor answers: it is
 * `inert`, so a screen-reader's virtual cursor cannot wander out of the dialog
 * the way Tab already cannot.
 *
 * The captured overflow lives at module scope on purpose. Captured per-overlay,
 * a second overlay opening on top of a first captures "hidden", and whichever
 * closes last writes "hidden" back — the page stays locked for the session.
 */
function useBackgroundLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const root = document.getElementById('app-root-container');
    if (lockCount === 0) {
      overflowBeforeLock = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      root?.setAttribute('inert', '');
    }
    lockCount += 1;
    return () => {
      lockCount -= 1;
      if (lockCount === 0) {
        document.body.style.overflow = overflowBeforeLock;
        root?.removeAttribute('inert');
      }
    };
  }, [active]);
}

/** Open overlays, bottom of the stack first. Only the last one takes keys. */
const stack: HTMLElement[] = [];

/** Escape to dismiss, Tab kept inside, focus handed back to whatever opened it. */
function useModalFocus(
  active: boolean,
  panelRef: { current: HTMLDivElement | null },
  onDismiss: () => void,
) {
  useEffect(() => {
    if (!active) return;
    const opener = document.activeElement as HTMLElement | null;
    const restoreFocus = () => opener?.focus?.();
    const self = panelRef.current;
    if (self) stack.push(self);

    const frame = requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const first = panel.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panel).focus();
    });

    function onKeyDown(event: KeyboardEvent) {
      const panel = panelRef.current;
      if (!panel) return;
      // Every overlay listens on document, so without this a stacked pair
      // would both see the same Escape and both would close. Only the overlay
      // on top of the stack answers.
      if (stack[stack.length - 1] !== panel) return;
      if (event.key === 'Escape') {
        event.stopPropagation();
        onDismiss();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
      const index = self ? stack.indexOf(self) : -1;
      if (index !== -1) stack.splice(index, 1);
      restoreFocus();
    };
  }, [active, panelRef, onDismiss]);
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    update();
    list.addEventListener('change', update);
    return () => list.removeEventListener('change', update);
  }, [query]);
  return matches;
}

/** md: — tablet portrait and up. */
export const TABLET_UP = '(min-width: 48rem)';

/* Gutters around a floating panel follow the page: 24 / 32 / 48. */
const VIEWPORT: Record<OverlayPlacement, string> = {
  center: 'items-center justify-center p-6 md:p-8 lg:p-12',
  bottom: 'items-end justify-center',
  left: 'items-stretch justify-start',
  responsive: 'items-end justify-center md:items-center md:p-8 lg:p-12',
};

/* The shadow belongs to the placement, not the breakpoint: shadow-sheet casts
   upward, which is right for something rising from the thumb edge and wrong
   for a centred dialog or a side drawer. `responsive` genuinely changes
   placement at md:, so it is the only one that changes shadow there. */
const PANEL: Record<OverlayPlacement, string> = {
  center: 'w-full max-w-sheet rounded-card max-h-[calc(100dvh-96px)] shadow-dialog',
  bottom:
    'w-full rounded-t-hero max-h-[85dvh] md:max-w-sheet md:rounded-hero shadow-sheet',
  left: 'h-full w-full max-h-dvh md:max-w-drawer md:border-r md:border-rule shadow-dialog',
  responsive:
    'w-full rounded-t-hero max-h-[85dvh] md:max-w-sheet md:rounded-card md:max-h-[calc(100dvh-128px)] shadow-sheet md:shadow-dialog',
};

export interface OverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placement?: OverlayPlacement;
  /** Cream is conversation, onyx is theatre. Sheets are usually where work happens. */
  ground?: OverlayGround;
  title?: Renderable;
  description?: Renderable;
  /** Bottom-anchored actions. Capped, never spread across a tablet. */
  footer?: Renderable;
  children?: Renderable;
  className?: string;
}

export function Overlay({
  open,
  onOpenChange,
  placement = 'center',
  ground = 'cream',
  title,
  description,
  footer,
  children,
  className,
}: OverlayProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const isTablet = useMediaQuery(TABLET_UP);
  const titleId = useId();
  const descriptionId = useId();

  const dismiss = useCallback(() => onOpenChange(false), [onOpenChange]);

  useBackgroundLock(open);
  useModalFocus(open, panelRef, dismiss);

  // The panel slides in from its own edge, and settles — Place. On tablet the
  // responsive panel is a centred dialog, so it rises rather than slides.
  const slidesFromEdge =
    placement === 'bottom' ||
    placement === 'left' ||
    (placement === 'responsive' && !isTablet);

  const hidden = reduced
    ? { opacity: 0 }
    : placement === 'left'
      ? { opacity: 1, x: '-100%' }
      : slidesFromEdge
        ? { opacity: 1, y: '100%' }
        : { opacity: 0, y: 8 };

  const shown = reduced ? { opacity: 1 } : { opacity: 1, x: 0, y: 0 };

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div
          data-slot="overlay"
          className={cn('fixed inset-0 z-50 flex', VIEWPORT[placement])}
        >
          <motion.div
            data-slot="overlay-backdrop"
            aria-hidden="true"
            onClick={dismiss}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transition('shift', reduced)}
            className="absolute inset-0 bg-onyx/70 backdrop-blur-sm"
          />
          <motion.div
            ref={panelRef}
            data-slot="overlay-panel"
            data-ground={ground}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
            initial={hidden}
            animate={shown}
            exit={hidden}
            transition={transition('place', reduced)}
            className={cn(
              'relative flex min-h-0 flex-col overflow-hidden',
              'border-rule',
              PANEL[placement],
              className,
            )}
          >
            {title || description ? (
              <header className="flex items-start justify-between gap-4 border-b border-rule px-6 py-4">
                <div className="flex min-w-0 flex-col gap-1">
                  {title ? (
                    <h2
                      id={titleId}
                      className="text-screen font-medium text-fg"
                    >
                      {title}
                    </h2>
                  ) : null}
                  {description ? (
                    <p
                      id={descriptionId}
                      className="max-w-measure text-body text-fg-muted"
                    >
                      {description}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={dismiss}
                  aria-label="Close"
                  className={cn(
                    '-mr-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full',
                    'text-fg-muted transition-colors duration-shift ease-shift',
                    'hoverable:hover:text-fg',
                  )}
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              </header>
            ) : null}

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6">
              {children}
            </div>

            {footer ? (
              <footer className="safe-bottom border-t border-rule px-6 py-4">
                <div className="mx-auto flex w-full max-w-action flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-end">
                  {footer}
                </div>
              </footer>
            ) : (
              <div className="safe-bottom" />
            )}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
