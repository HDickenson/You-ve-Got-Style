import React, { useId } from 'react';
import { Lock } from 'lucide-react';
import { StyleConstraints } from '../types';
import { GuardrailKey, HARD_RULES, SOFT_RULES } from '../lib/guardrails';
import { ActionRow, AppContainer, Stack } from './layout';
import { Button, Slider, Switch } from './ui';
import { Price } from './brand';
import { cn } from '../lib/cn';
import type { ElementProps } from '../lib/props';
import { formatAED } from '../lib/currency';

interface StyleGuardrailsProps {
  constraints: StyleConstraints;
  setConstraints: React.Dispatch<React.SetStateAction<StyleConstraints>>;
  onSaveAndProceed: () => void;
}

type RuleKey = GuardrailKey;

/**
 * Absolute vs. preference — read from `lib/guardrails`, the same source
 * discovery filters against. Duplicating this list here is how a screen ends
 * up promising "never shown to you" for a rule the deck no longer enforces;
 * one list, read by both, is what keeps the promise true.
 */
const HARD = HARD_RULES;
const SOFT = SOFT_RULES;

const FABRICS: ReadonlyArray<string> = [
  'Mulberry Silk',
  'Baby Cashmere',
  'Virgin Wool',
  'Raw Linen',
  'Heavy Satin',
];

/**
 * The top stop of the range is not a number — it is the absence of a ceiling,
 * and it sits one step *above* the maximum so AED 25,000 stays reachable.
 */
const PRICE_MIN = 1000;
const PRICE_MAX = 25000;
const PRICE_STEP = 500;
const NO_CEILING = PRICE_MAX + PRICE_STEP;

/** Hairlines separate the rows inside the ruled plane; the plane is the group. */
const ROW = 'py-4 first:pt-0 last:pb-0';

interface ToggleRowProps extends ElementProps {
  label: string;
  detail?: string;
  /** The plane sets the tone: `fg-muted` fails AA on sand, so ink there. */
  detailClassName?: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
}

function ToggleRow({
  label,
  detail,
  detailClassName = 'text-fg-muted',
  checked,
  onCheckedChange,
  className,
}: ToggleRowProps) {
  const id = useId();

  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0 flex-1">
        <p id={`${id}-label`} className="text-body font-medium text-fg">
          {label}
        </p>
        {detail && (
          <p id={`${id}-detail`} className={cn('text-body', detailClassName)}>
            {detail}
          </p>
        )}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-labelledby={`${id}-label`}
        aria-describedby={detail ? `${id}-detail` : undefined}
      />
    </div>
  );
}

/**
 * Two planes, and only one of them is an object. The rules the algorithm obeys
 * are carded on sand and ruled like a document; the ones it merely listens to
 * sit flat on the page with nothing around them, separated by air. White on
 * cream is 1.08:1 — a second card would have promised a distinction the eye
 * cannot see.
 *
 * No gold on this screen. Nothing here is a selection, a completed
 * intelligence or a signature moment — the user is working, and cream is
 * conversation.
 */
export const StyleGuardrails: React.FC<StyleGuardrailsProps> = ({
  constraints,
  setConstraints,
  onSaveAndProceed,
}) => {
  const id = useId();
  const hardId = `${id}-hard`;
  const softId = `${id}-soft`;
  const priceId = `${id}-price`;

  const toggle = (key: RuleKey) => (next: boolean) => {
    setConstraints((prev) => ({ ...prev, [key]: next }));
  };

  const toggleFabric = (fabric: string) => {
    setConstraints((prev) => ({
      ...prev,
      preferredFabrics: prev.preferredFabrics.includes(fabric)
        ? prev.preferredFabrics.filter((item) => item !== fabric)
        : [...prev.preferredFabrics, fabric],
    }));
  };

  const setCeiling = (value: number) => {
    setConstraints((prev) => ({
      ...prev,
      maxPriceAED: value > PRICE_MAX ? undefined : value,
    }));
  };

  const ceiling = constraints.maxPriceAED;
  const ceilingLabel = ceiling === undefined ? 'No ceiling' : formatAED(ceiling);

  return (
    <AppContainer
      as="section"
      aria-label="Style guardrails"
      className="@container py-8 md:py-12"
    >
      <Stack gap={32}>
        <h2 className="text-screen font-medium text-fg">Set your guardrails</h2>

        {/* Extra width becomes a second column, never a wider toggle row. The
            query is on this container rather than the viewport so the same
            component stays single-column inside a 560px sheet.

            The ruled plane takes the larger share, and its padding does not
            step up until the container is wide enough to afford it (@4xl,
            landscape): a row's text runs ~252px at 768 and ~358px at 1024
            against 230px on a phone, so the tablet spends its width on the
            rule rather than on the gutter. */}
        <div className="grid grid-cols-1 items-start gap-6 @2xl:grid-cols-[1.2fr_1fr] @2xl:gap-8">
          {/* Ruled from ink at 20%, not from `--ygs-rule`: that token is
              shared with cream and measures 1.03:1 on sand, so the document
              ruling this plane's whole idea rests on would not draw. */}
          <section
            aria-labelledby={hardId}
            className="ground-sand rounded-card border border-fg/20 p-6 @4xl:p-8"
          >
            <div className="flex items-center gap-2">
              <Lock className="size-4 shrink-0 text-fg" aria-hidden="true" />
              <h3
                id={hardId}
                className="text-eyebrow font-medium uppercase text-fg"
              >
                Absolute
              </h3>
            </div>
            <p className="mt-3 max-w-measure text-body text-fg">
              Obeyed without exception. A look that breaks one is never shown to
              you.
            </p>

            <div className="mt-6 divide-y divide-fg/20 border-t border-fg/20 pt-6">
              {HARD.map((rule) => (
                <ToggleRow
                  key={rule.key}
                  className={ROW}
                  label={rule.label}
                  detail={rule.detail}
                  detailClassName="text-fg"
                  checked={constraints[rule.key]}
                  onCheckedChange={toggle(rule.key)}
                />
              ))}
            </div>
          </section>

          <section aria-labelledby={softId}>
            <h3
              id={softId}
              className="text-eyebrow font-medium uppercase text-fg-muted"
            >
              Preference
            </h3>
            <p className="mt-3 max-w-measure text-body text-fg-muted">
              These are recorded with your looks and never rule one out. Only
              your spend ceiling changes the order you see things in today.
            </p>

            <Stack gap={24} className="mt-6">
              {SOFT.map((rule) => (
                <ToggleRow
                  key={rule.key}
                  label={rule.label}
                  detail={rule.detail}
                  checked={constraints[rule.key]}
                  onCheckedChange={toggle(rule.key)}
                />
              ))}

              <div>
                <p className="text-control font-medium uppercase text-fg-muted">
                  Fabrics you prefer
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {FABRICS.map((fabric) => {
                    const selected = constraints.preferredFabrics.includes(fabric);
                    return (
                      <Button
                        key={fabric}
                        size="sm"
                        // Not `primary`: that fill belongs to the one action
                        // this screen is asking for. Not `selected`: gold is
                        // rationed and five chosen fabrics is wallpaper. An
                        // ink outline says chosen and nothing else does.
                        //
                        // A ring rather than `border-fg`, because `cn` joins
                        // and does not merge: `border-rule` from the variant
                        // is emitted after `border-fg` and would win. The ring
                        // collides with nothing the variant sets.
                        variant="secondary"
                        className={selected ? 'ring-1 ring-fg' : undefined}
                        aria-pressed={selected}
                        onClick={() => toggleFabric(fabric)}
                      >
                        {fabric}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-baseline justify-between gap-4">
                  <label
                    htmlFor={priceId}
                    className="text-control font-medium uppercase text-fg-muted"
                  >
                    Spend up to
                  </label>
                  {ceiling === undefined ? (
                    <span className="text-price text-fg">No ceiling</span>
                  ) : (
                    <Price>{ceilingLabel}</Price>
                  )}
                </div>
                <Slider
                  id={priceId}
                  className="mt-2"
                  min={PRICE_MIN}
                  max={NO_CEILING}
                  step={PRICE_STEP}
                  value={ceiling ?? NO_CEILING}
                  aria-valuetext={ceilingLabel}
                  onValueChange={setCeiling}
                />
              </div>
            </Stack>
          </section>
        </div>

        <ActionRow align="start">
          <Button onClick={onSaveAndProceed}>Show me looks</Button>
        </ActionRow>
      </Stack>
    </AppContainer>
  );
};
