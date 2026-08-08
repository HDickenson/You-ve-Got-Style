import React, { useState } from 'react';
import {
  Bookmark,
  Camera,
  Compass,
  Menu,
  Ruler,
  Shirt,
  SlidersHorizontal,
} from 'lucide-react';
import { AppPhase, StyleConstraints, Wardrobe } from '../types';
import { YMark, Wordmark } from './brand';
import { Badge, Button, Separator, Sheet } from './ui';
import { AppContainer } from './layout';
import { cn } from '../lib/cn';

interface HeaderNavProps {
  currentPhase: AppPhase;
  setPhase: (phase: AppPhase) => void;
  savedCount: number;
  constraints: StyleConstraints;
  onOpenGuardrails: () => void;
  wardrobe: Wardrobe | null;
  onOpenWardrobe: () => void;
  heightCm: number;
  onFindLook?: (occasion: string) => Promise<void>;
  isFinding?: boolean;
}

/** The context word beside the Y. One word — the screen says the rest. */
const CONTEXT: Record<AppPhase, string> = {
  wardrobe: 'Welcome',
  onboarding: 'Studio',
  sizing: 'Fit',
  guardrails: 'Guardrails',
  discovery: 'Discover',
  capsule: 'Capsule',
};

const WARDROBE_LABEL: Record<Wardrobe, string> = {
  womenswear: 'Womenswear',
  menswear: 'Menswear',
};

const DESTINATIONS: ReadonlyArray<{
  phase: AppPhase;
  label: string;
  Icon: typeof Camera;
}> = [
  { phase: 'discovery', label: 'Discover', Icon: Compass },
  { phase: 'onboarding', label: 'Studio', Icon: Camera },
  { phase: 'sizing', label: 'Fit', Icon: Ruler },
  { phase: 'capsule', label: 'Capsule', Icon: Bookmark },
];

const ROW = [
  'flex min-h-14 w-full items-center gap-4 rounded-control px-4 py-3 text-left',
  'transition-colors duration-shift ease-shift',
].join(' ');

/**
 * Y / Context · Primary Action · Menu.
 *
 * Two actions live up here — the screen's one contextual action and the menu
 * that opens the wider product. There is no tab bar, no search, no bell.
 */
export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentPhase,
  setPhase,
  savedCount,
  constraints,
  onOpenGuardrails,
  wardrobe,
  onOpenWardrobe,
  heightCm,
  onFindLook,
  isFinding,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const activeConstraintCount = [
    constraints.modestWear,
    constraints.sleevesBelowElbow,
    constraints.noTrousers,
    constraints.hemlineBelowKnee,
    constraints.noNeonColors,
    constraints.noLoudPrints,
  ].filter(Boolean).length;

  const goTo = (phase: AppPhase) => {
    setPhase(phase);
    setIsMenuOpen(false);
  };

  const findLook = async () => {
    setIsMenuOpen(false);
    setPhase('discovery');
    await onFindLook?.('All Occasions');
  };

  const showFindLook = Boolean(onFindLook) && currentPhase === 'discovery';

  return (
    <>
      <header
        id="app-header-nav"
        className="safe-top sticky top-0 z-40 border-b border-rule bg-surface/85 backdrop-blur-md"
      >
        <AppContainer>
          <div className="flex h-16 items-center justify-between gap-4 md:h-20">
            <div className="flex min-w-0 items-center gap-3">
              <YMark
                className="h-6 w-auto shrink-0 md:h-7"
                title="You've Got Style"
              />
              <span className="truncate text-eyebrow font-medium uppercase text-fg-muted">
                {CONTEXT[currentPhase]}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {showFindLook ? (
                <>
                  {/* The button's own label stays put. A disabled control is
                      dropped from the accessibility tree in several browsers,
                      so a label that flips to "Finding your look" while the
                      button disables can announce nothing at all. The status
                      lives in its own region and is announced either way. */}
                  <span role="status" className="sr-only">
                    {isFinding ? 'Finding your look' : ''}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={findLook}
                    disabled={isFinding}
                  >
                    Find a look
                  </Button>
                </>
              ) : null}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(true)}
                aria-label="Open menu"
                aria-expanded={isMenuOpen}
              >
                <Menu className="size-5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </AppContainer>
      </header>

      {/* Full-screen on phone, a 420px side drawer from md:. */}
      <Sheet
        side="left"
        ground="cream"
        open={isMenuOpen}
        onOpenChange={setIsMenuOpen}
        title={<Wordmark className="h-7 w-auto" title="You've Got Style" />}
      >
        {/* The drawer has room on a tablet and should use it: 4px gaps between
            56px rows read as phone-app density, not as space. */}
        <nav aria-label="Sections" className="flex flex-col gap-2 md:gap-3">
          {DESTINATIONS.map(({ phase, label, Icon }) => {
            const active = currentPhase === phase;
            return (
              <button
                key={phase}
                type="button"
                onClick={() => goTo(phase)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  ROW,
                  active ? 'bg-fg/5' : 'hoverable:hover:bg-fg/5',
                )}
              >
                <Icon
                  className="size-5 shrink-0 text-fg-muted"
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate text-body text-fg">
                  {label}
                </span>
                {phase === 'sizing' ? (
                  <Badge className="tabular">{heightCm} cm</Badge>
                ) : null}
                {phase === 'capsule' && savedCount > 0 ? (
                  <Badge className="tabular">{savedCount} saved</Badge>
                ) : null}
                {active ? (
                  // Marking the selection is exactly what gold is for, but on
                  // cream gold is 2.01:1 — the ink ring is what actually makes
                  // the dot visible, and the gold says which kind of mark it is.
                  <span
                    className="size-2 shrink-0 rounded-full bg-gold ring-1 ring-fg"
                    aria-hidden="true"
                  />
                ) : null}
              </button>
            );
          })}
        </nav>

        <Separator className="my-6" />

        <button
          type="button"
          onClick={() => {
            onOpenWardrobe();
            setIsMenuOpen(false);
          }}
          className={cn(ROW, 'hoverable:hover:bg-fg/5')}
        >
          <Shirt className="size-5 shrink-0 text-fg-muted" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-body text-fg">
            Shopping for
          </span>
          {wardrobe ? (
            <Badge className="tabular">{WARDROBE_LABEL[wardrobe]}</Badge>
          ) : null}
        </button>

        <button
          type="button"
          onClick={() => {
            onOpenGuardrails();
            setIsMenuOpen(false);
          }}
          className={cn(ROW, 'hoverable:hover:bg-fg/5')}
        >
          <SlidersHorizontal
            className="size-5 shrink-0 text-fg-muted"
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1 truncate text-body text-fg">
            Style guardrails
          </span>
          <Badge className="tabular">{activeConstraintCount} active</Badge>
        </button>
      </Sheet>
    </>
  );
};
