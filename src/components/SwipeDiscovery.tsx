import React, { useEffect, useRef, useState } from 'react';
import { Bookmark, ShoppingBag, X } from 'lucide-react';
import { FashionLook, StyleConstraints, BrandSizeMapping, CapturedProfile } from '../types';
import { evaluateLook, filterByHardGuardrails, withinPriceCeiling } from '../lib/guardrails';
import { OccasionTitle, YMark } from './brand';
import { Button, Separator } from './ui';
import { AppContainer, Stack } from './layout';
import { cn } from '../lib/cn';

interface SwipeDiscoveryProps {
  looks: FashionLook[];
  constraints: StyleConstraints;
  /**
   * Held for the shell's contract. The digital-twin face bubble that used to
   * read it is gone: the look card carries an occasion, a title and the
   * garments — nothing else is allowed to land on it.
   */
  capturedProfile: CapturedProfile;
  brandSizes: BrandSizeMapping[];
  onSwipeRight: (look: FashionLook) => void;
  onSwipeLeft: (look: FashionLook) => void;
  onBuyLook: (look: FashionLook) => void;
  onFindLook: (occasion: string) => Promise<void>;
  isFinding: boolean;
  /** Three seconds into `isFinding` with nothing back yet. Optional so this
   *  component still type-checks against a shell that predates the slow
   *  path. */
  isFindingSlow?: boolean;
  /** Set when the last `onFindLook` failed. Cleared by the next attempt. */
  findError?: string | null;
}

const OCCASIONS = [
  'All Occasions',
  'Board Meeting',
  'Networking Dinner',
  'Weekend Brunch',
  'Art Gallery Opening',
  'Galas & Events',
];

/** How far a look has to travel before the gesture counts as a decision. */
const SWIPE_COMMIT = 96;

/**
 * One card, centred, capped. The 4:5 plate never grows to tablet width — a
 * look ballooning across 1024px is the failure this cap exists to prevent, and
 * the reasoning column takes the same measure so the two read as a pair.
 */
const PLATE = 'mx-auto w-full max-w-[420px]';

/** "a" · "a and b" · "a, b and c" — a sentence, not a list widget. */
function asSentence(parts: readonly string[]) {
  if (parts.length < 2) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

/**
 * Discovery — the screen the whole product exists to reach.
 *
 * One look at a time, presented on theatre ground: a 4:5 editorial plate with
 * an occasion, a title and the garments. No price, no house mark, no rating,
 * no heart, no cart — the card is a poster, not a listing. The reasoning sits
 * apart from it, on forest, which is the only ground Style Intelligence takes.
 *
 * Deciding is a gesture or a button, never only a gesture: drag the plate left
 * or right, or use the row underneath. Nothing here depends on hover.
 */
export const SwipeDiscovery: React.FC<SwipeDiscoveryProps> = ({
  looks,
  constraints,
  brandSizes,
  onSwipeRight,
  onSwipeLeft,
  onBuyLook,
  onFindLook,
  isFinding,
  isFindingSlow = false,
  findError = null,
}) => {
  const [selectedOccasion, setSelectedOccasion] = useState<string>('All Occasions');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [note, setNote] = useState<{ text: string; id: number } | null>(null);
  const [dragX, setDragX] = useState<number>(0);
  const dragOrigin = useRef<number | null>(null);

  // A confirmation is a sentence that leaves, not a badge that celebrates.
  useEffect(() => {
    if (!note) return;
    const timer = setTimeout(() => setNote(null), 2400);
    return () => clearTimeout(timer);
  }, [note]);

  const byOccasion = looks.filter(
    (look) => selectedOccasion === 'All Occasions' || look.occasion === selectedOccasion,
  );

  // Fail closed: every active hard guardrail is enforced here, on the look's
  // own words, not on whatever the model that wrote those words claims about
  // itself. A look that misses one never becomes a card — it does not reach
  // the deck to be swiped past or rendered with a badge it does not earn.
  const eligibleLooks = filterByHardGuardrails(byOccasion, constraints);

  // The spend ceiling is a preference: it reorders, it does not exclude. A
  // stable sort keeps everything else about the deck's order untouched.
  const filteredLooks = [...eligibleLooks].sort((a, b) => {
    const aOver = withinPriceCeiling(a.priceAED, constraints) ? 0 : 1;
    const bOver = withinPriceCeiling(b.priceAED, constraints) ? 0 : 1;
    return aOver - bOver;
  });

  const candidateLook = filteredLooks.length
    ? filteredLooks[currentIndex % filteredLooks.length]
    : null;

  // Belt and braces: even if a hard-violating look somehow reached this list,
  // it is refused here too rather than rendered and merely mislabelled.
  const activeLook =
    candidateLook && evaluateLook(candidateLook, constraints).passesHard ? candidateLook : null;

  const say = (text: string) => setNote({ text, id: Date.now() });

  const decide = (intent: 'save' | 'pass') => {
    if (!activeLook) return;
    if (intent === 'save') {
      onSwipeRight(activeLook);
      say('Saved to your capsule');
    } else {
      onSwipeLeft(activeLook);
      say('Noted');
    }
    setCurrentIndex((prev) => prev + 1);
  };

  const buy = () => {
    if (!activeLook) return;
    onSwipeRight(activeLook);
    onBuyLook(activeLook);
  };

  const chooseOccasion = (occasion: string) => {
    setSelectedOccasion(occasion);
    setCurrentIndex(0);
  };

  // The occasions are one choice among six, so they are a radio group — and a
  // radio group moves on the arrow keys with a single tab stop, not six.
  const moveOccasion = (event: React.KeyboardEvent<HTMLElement>) => {
    const last = OCCASIONS.length - 1;
    const from = OCCASIONS.indexOf(selectedOccasion);
    const to =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? last
          : event.key === 'ArrowRight' || event.key === 'ArrowDown'
            ? (from + 1) % OCCASIONS.length
            : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
              ? (from + last) % OCCASIONS.length
              : -1;
    if (to < 0) return;

    event.preventDefault();
    chooseOccasion(OCCASIONS[to]);
    event.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')[to]?.focus();
  };

  // --- The gesture. Pointer events, so a finger and a trackpad are the same
  // code path; `touch-pan-y` keeps the page scrollable underneath it.
  const startDrag = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    dragOrigin.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: React.PointerEvent<HTMLElement>) => {
    if (dragOrigin.current === null) return;
    setDragX(event.clientX - dragOrigin.current);
  };

  const endDrag = (event: React.PointerEvent<HTMLElement>) => {
    if (dragOrigin.current === null) return;
    const travelled = event.clientX - dragOrigin.current;
    dragOrigin.current = null;
    setDragX(0);
    if (travelled > SWIPE_COMMIT) decide('save');
    else if (travelled < -SWIPE_COMMIT) decide('pass');
  };

  // Hard guardrails never reach here missed — activeLook is already refused
  // otherwise. What is left to report is soft: quiet colour, restrained
  // print, and (disclosed rather than silently sorted-around) the spend
  // ceiling, which is a preference and so never removed this look either.
  const report = activeLook ? evaluateLook(activeLook, constraints) : null;
  const overCeiling = activeLook ? !withinPriceCeiling(activeLook.priceAED, constraints) : false;
  const softMissed: readonly string[] = report
    ? [
        ...report.softMissed,
        ...(overCeiling
          ? [
              `it runs AED ${(
                activeLook!.priceAED - (constraints.maxPriceAED as number)
              ).toLocaleString('en-US')} over your ceiling`,
            ]
          : []),
      ]
    : [];
  const hasGuardrailSignal =
    (report ? report.active.length > 0 : false) || constraints.maxPriceAED !== undefined;
  const withinGuardrails = hasGuardrailSignal && softMissed.length === 0;
  const size = activeLook?.brand_sizes?.[0] ?? brandSizes[0];

  // The garments, as the card states them. A dress replaces the pair.
  const attributes: ReadonlyArray<[string, string]> = activeLook
    ? activeLook.dress_garment
      ? [
          ['Dress', activeLook.dress_garment],
          ['Cloth', activeLook.fabric],
        ]
      : [
          ['Top', activeLook.top_garment],
          ['Bottom', activeLook.bottom_garment],
          ['Cloth', activeLook.fabric],
        ]
    : [];

  return (
    <AppContainer
      as="section"
      id="module-swipe-discovery"
      className="flex flex-1 flex-col py-6 md:py-8"
    >
      <Stack gap={24} className="flex-1">
        {/* Occasion. Scrolls inside itself on a phone, wraps on a tablet — the
            page never moves sideways. It takes the plate's own measure and the
            plate's own column, so the least important control on the screen
            cannot become the widest thing on it: at md: it caps with the card,
            and at lg: it sits directly above it rather than banner-wide over a
            420px centrepiece. */}
        <div className="grid lg:grid-cols-2 lg:gap-12">
          <div
            role="radiogroup"
            aria-label="Occasion"
            onKeyDown={moveOccasion}
            className={cn(
              PLATE,
              'flex gap-2 overflow-x-auto py-1',
              'md:flex-wrap md:overflow-x-visible',
              'lg:mx-0 lg:justify-self-end',
            )}
          >
            {OCCASIONS.map((occasion) => {
              const active = occasion === selectedOccasion;
              return (
                <Button
                  key={occasion}
                  size="sm"
                  variant={active ? 'selected' : 'secondary'}
                  role="radio"
                  aria-checked={active}
                  tabIndex={active ? 0 : -1}
                  onClick={() => chooseOccasion(occasion)}
                  className="shrink-0"
                >
                  {occasion}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Phone and tablet portrait stack; tablet landscape sets the reasoning
            beside the look rather than under it. The two columns run to a
            common height on purpose — that is what lets the actions settle on
            the plate's bottom edge rather than in the middle of the screen. */}
        <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch lg:gap-12">
          <div className={cn(PLATE, 'lg:mx-0 lg:justify-self-end')}>
            {isFinding ? (
              /* Outcomes, not machinery — and nothing spins. The mark breathes
                 while the look is composed, and stops when it lands. Past
                 three seconds the sentence changes — the mark keeps
                 breathing rather than a progress bar pretending to know how
                 much is left. */
              <div
                role="status"
                aria-live="polite"
                className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-4 rounded-hero border border-rule bg-surface-raised"
              >
                <YMark className="h-8 w-auto motion-safe:animate-breath" />
                {/* A sentence the concierge says, so it is set as a sentence —
                    13px tracked caps would make it a system state chip. */}
                <p className="text-body text-fg-muted">
                  {isFindingSlow
                    ? 'Still composing — this is taking longer than usual.'
                    : 'Finding your look…'}
                </p>
              </div>
            ) : findError ? (
              /* A failure is not content: it replaces the plate rather than
                 rendering inside it, and it says what happened and what to
                 do next — nothing about the network or the model. */
              <div className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-6 rounded-hero border border-rule bg-surface-raised p-6 text-center">
                <p className="max-w-measure text-body text-fg-muted">{findError}</p>
                <Button size="sm" onClick={() => void onFindLook(selectedOccasion)}>
                  Try again
                </Button>
              </div>
            ) : activeLook ? (
              <article
                key={activeLook.id}
                aria-label={activeLook.look_title}
                onPointerDown={startDrag}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                style={
                  dragX
                    ? {
                        transform: `translateX(${dragX}px) rotate(${dragX * 0.02}deg)`,
                      }
                    : undefined
                }
                className={cn(
                  'relative isolate w-full touch-pan-y select-none overflow-hidden',
                  'rounded-hero border border-rule bg-surface-raised',
                  // Only on release: while a finger is down the card tracks it
                  // one to one. The mount crossfade is Shift — the transition
                  // for one look becoming another — and it owns opacity, so
                  // the drag moves the card and does not fade it.
                  !dragX && 'transition-transform duration-shift ease-shift',
                  'motion-safe:animate-shift',
                )}
              >
                <div className="relative aspect-[4/5] w-full">
                  <img
                    src={activeLook.imageUrl}
                    alt={activeLook.look_title}
                    draggable={false}
                    referrerPolicy="no-referrer"
                    className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
                  />

                  {/* A failed render is a stated failure, not a placeholder
                      passed off as the real thing. */}
                  {activeLook.imageGenerationFailed ? (
                    <p
                      role="status"
                      className="ground-onyx absolute inset-x-0 top-0 bg-onyx px-6 py-3 text-center text-eyebrow font-medium uppercase text-fg-muted"
                    >
                      Photo preview unavailable — styling details below still apply
                    </p>
                  ) : null}

                  {/* The caption always sits on theatre, whatever ground the
                      screen is on — and it is painted, not tinted. A gradient
                      thin enough to leave the photograph readable is too thin
                      to carry 11px type over a pale frame, and a gradient tuned
                      to this caption's height stops being legible the moment a
                      title wraps. So the band is opaque onyx at whatever height
                      the caption takes, and the scrim is only the 24px feather
                      that dissolves its top edge back into the image.
                      Padding stays 24 at md: — the plate is capped at the same
                      breakpoint, so stepping it up would narrow the caption
                      rather than widen the card. */}
                  <div className="ground-onyx absolute inset-x-0 bottom-0 bg-onyx p-6">
                    <div
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-full h-24 bg-gradient-to-t from-onyx to-transparent"
                    />

                    <p className="text-eyebrow font-medium uppercase text-fg-muted">
                      {activeLook.occasion}
                    </p>

                    <OccasionTitle className="mt-2">
                      {activeLook.look_title}
                    </OccasionTitle>

                    {/* The garments are values, not prose. At body size three
                        rows turn the poster into a spec table and cover half
                        the photograph; at the price role they stay legible and
                        give the image its space back. */}
                    <dl className="mt-4 flex flex-col gap-2">
                      {attributes.map(([label, value]) => (
                        <div key={label} className="flex items-baseline gap-3">
                          <dt className="w-16 shrink-0 text-eyebrow font-medium uppercase text-fg-muted">
                            {label}
                          </dt>
                          <dd className="line-clamp-2 min-w-0 flex-1 text-price text-fg">
                            {value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              </article>
            ) : (
              <div className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-6 rounded-hero border border-rule bg-surface-raised p-6 text-center">
                <p className="max-w-measure text-body text-fg-muted">
                  Nothing composed for this occasion yet.
                </p>
                <Button
                  size="sm"
                  onClick={() => {
                    void onFindLook(selectedOccasion);
                  }}
                >
                  Find a look
                </Button>
              </div>
            )}
          </div>

          {activeLook && !isFinding && !findError ? (
            <div
              className={cn(
                PLATE,
                'flex flex-col gap-6 lg:mx-0 lg:justify-self-start',
              )}
            >
              {/* Style Intelligence — the only forest on the only screen that
                  gets it, and the only gold here besides the chosen occasion. */}
              <section
                aria-label="Style intelligence"
                className="ground-forest rounded-card p-6 md:p-8"
              >
                <div className="flex items-center gap-3">
                  <YMark className="h-5 w-auto" />
                  <span className="text-eyebrow font-medium uppercase text-fg-muted">
                    Style intelligence
                  </span>
                </div>

                <h3 className="mt-4 text-screen font-medium text-fg">
                  Why this works
                </h3>
                <p className="mt-2 max-w-measure text-body text-fg-muted">
                  {activeLook.capsule_synergy}
                </p>

                {hasGuardrailSignal || size ? (
                  <>
                    <Separator className="my-4" />

                    {withinGuardrails || size ? (
                      <div className="flex flex-wrap items-baseline gap-x-8 gap-y-3">
                        {/* The one place gold is permitted here: a completed
                            intelligence result. A look that misses something is
                            not a result to gild, so it says what it misses in a
                            sentence instead — never a fraction the heading
                            above it would have to argue with. Only soft signals
                            land here: an active look never carries a missed
                            hard guardrail, so there is nothing hard to weigh
                            against this badge. */}
                        {withinGuardrails ? (
                          <p className="text-control font-medium uppercase text-gold">
                            Within your guardrails
                          </p>
                        ) : null}

                        {size ? (
                          <p className="flex items-baseline gap-2">
                            <span className="text-control font-medium uppercase text-fg-muted">
                              Your size
                            </span>
                            <span className="tabular text-body text-fg">
                              {size.brandName} {size.recommendedSize}
                            </span>
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    {softMissed.length > 0 ? (
                      <p className="mt-4 max-w-measure text-body text-fg-muted">
                        Worth knowing: {asSentence(softMissed)}.
                      </p>
                    ) : null}
                  </>
                ) : null}
              </section>

              {/* Three actions, capped and thumb-reachable at both sizes. In
                  landscape the column runs the full height of the plate beside
                  it, so `lg:mt-auto` settles the row on the poster's bottom
                  edge instead of leaving it floating mid-screen. */}
              <div className="mx-auto flex w-full max-w-action items-center gap-3 lg:mt-auto">
                <Button
                  id="btn-not-like-me"
                  variant="secondary"
                  size="icon"
                  aria-label="Not for me"
                  onClick={() => decide('pass')}
                >
                  <X className="size-5" aria-hidden="true" />
                </Button>

                <Button id="btn-buy-the-look" size="sm" className="flex-1" onClick={buy}>
                  <ShoppingBag className="size-4" aria-hidden="true" />
                  Buy the look
                </Button>

                <Button
                  variant="secondary"
                  size="icon"
                  aria-label="Save to capsule"
                  onClick={() => decide('save')}
                >
                  <Bookmark className="size-5" aria-hidden="true" />
                </Button>
              </div>

              <p
                role="status"
                aria-live="polite"
                /* A sentence, not a state chip — and the reserved height is one
                   body line (17 × 1.6 = 27.2), so nothing shifts when it
                   arrives or leaves. `min-h-6` would have been 3px short. */
                className="min-h-8 text-center text-body text-fg-muted"
              >
                {note ? (
                  <span key={note.id} className="motion-safe:animate-resolve">
                    {note.text}
                  </span>
                ) : null}
              </p>
            </div>
          ) : null}
        </div>
      </Stack>
    </AppContainer>
  );
};
