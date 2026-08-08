import React from 'react';
import { Check } from 'lucide-react';
import { Wardrobe } from '../types';
import { Display } from './brand';
import { AppContainer, Stack } from './layout';
import { cn } from '../lib/cn';

interface ChooseWardrobeProps {
  selected: Wardrobe | null;
  onSelect: (wardrobe: Wardrobe) => void;
  /** False when a host (the "change it later" sheet) already carries the
   *  heading and framing copy — repeating the Display here would be a second
   *  editorial moment on the same screen, which the voice contract treats as
   *  neither. */
  intro?: boolean;
}

interface Option {
  value: Wardrobe;
  label: string;
  detail: string;
}

/**
 * A shopping context, not a declaration of identity — a gift buyer answers
 * this the same way a customer shopping their own wardrobe does. No
 * dropdown: the model forbids one for a two-way choice this consequential,
 * and a tap is the whole interaction.
 */
const OPTIONS: ReadonlyArray<Option> = [
  {
    value: 'womenswear',
    label: 'Womenswear',
    detail: 'Dresses, tailoring and eveningwear.',
  },
  {
    value: 'menswear',
    label: 'Menswear',
    detail: 'Tailoring, formalwear, thobe and kandura.',
  },
];

/**
 * The literal entry point — before consent, before capture. Everything that
 * follows (which measurements are asked for, which guardrail language
 * applies, which looks surface) forks on the answer, so it has to be known
 * before the first downstream screen builds on it rather than retrofitted
 * once one wardrobe's assumptions are already load-bearing.
 */
export const ChooseWardrobe: React.FC<ChooseWardrobeProps> = ({
  selected,
  onSelect,
  intro = true,
}) => {
  /** A radiogroup is one tab stop and the arrows move within it. Mirrors the
   *  occasion chips in discovery, which already did this correctly — the
   *  newest screen had two tab stops and dead arrow keys. */
  const moveOption = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];
    if (!keys.includes(event.key)) return;
    const from = OPTIONS.findIndex((o) => o.value === selected);
    const start = from < 0 ? 0 : from;
    const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown';
    const to =
      (start + (forward ? 1 : OPTIONS.length - 1)) % OPTIONS.length;

    // Focus only. In a normal radiogroup an arrow key also selects, but
    // selecting here advances the phase — a keyboard user exploring the two
    // options with arrows would be shoved into capture before they chose.
    // Space or Enter on the focused option commits it, which is the same
    // gesture a mouse user makes.
    event.preventDefault();
    event.currentTarget
      .querySelectorAll<HTMLElement>('[role="radio"]')
      [to]?.focus();
  };

  return (
    <AppContainer
      as="section"
      aria-label="Choose your wardrobe"
      className={intro ? 'py-8 md:py-12' : undefined}
    >
      <Stack gap={32}>
        {intro ? (
          <Stack gap={16}>
            <Display>What are you shopping for?</Display>
            <p className="max-w-measure text-body text-fg-muted">
              Not who you are — what fits, what's shown and what the
              guardrails mean all follow from this. Change it anytime from
              the menu.
            </p>
          </Stack>
        ) : null}

        <div
          role="radiogroup"
          aria-label="Wardrobe"
          onKeyDown={moveOption}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          {OPTIONS.map((option, index) => {
            const active = selected === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={active}
                tabIndex={index === 0 ? 0 : -1}
                onClick={() => onSelect(option.value)}
                className={cn(
                  'flex flex-col items-start gap-2 rounded-card border p-6 text-left md:p-8',
                  'transition-colors duration-shift ease-shift',
                  'motion-safe:active:scale-[0.98]',
                  active
                    ? 'border-fg bg-fg/5'
                    : 'border-control hoverable:hover:border-fg/60',
                )}
              >
                <span className="flex w-full items-center justify-between gap-4">
                  <span className="text-screen font-medium text-fg">
                    {option.label}
                  </span>
                  {active ? (
                    <Check className="size-5 shrink-0 text-fg" aria-hidden="true" />
                  ) : null}
                </span>
                <span className="max-w-measure text-body text-fg-muted">
                  {option.detail}
                </span>
              </button>
            );
          })}
        </div>
      </Stack>
    </AppContainer>
  );
};
