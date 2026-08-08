import { StyleConstraints } from '../types';

/**
 * The four rules the product plan calls hard cultural constraints, not taste.
 * An active hard rule that a look misses removes the look — it does not just
 * annotate it.
 */
export type HardGuardrailKey =
  | 'modestWear'
  | 'sleevesBelowElbow'
  | 'hemlineBelowKnee'
  | 'noTrousers';

/** Taste. These weight what surfaces first; they never remove a look. */
export type SoftGuardrailKey = 'noNeonColors' | 'noLoudPrints';

export type GuardrailKey = HardGuardrailKey | SoftGuardrailKey;

export interface GuardrailRule {
  key: GuardrailKey;
  label: string;
  /** Only where the label leaves something genuinely unsaid. */
  detail?: string;
  /** Said when an active guardrail is missed: "Worth knowing: {violation}." */
  violation: string;
}

/**
 * Single source of truth for what counts as absolute vs. preference. Both the
 * guardrails screen (which plane a toggle sits on) and discovery (which looks
 * get filtered out) read the same two lists, so the promise made on one
 * screen cannot silently stop matching what the other screen enforces.
 */
export const HARD_RULES: ReadonlyArray<GuardrailRule> = [
  {
    key: 'modestWear',
    label: 'Modest coverage',
    detail: 'High necklines, full coverage, opaque fabric.',
    violation: 'the cut is not a modest one',
  },
  {
    key: 'sleevesBelowElbow',
    label: 'Sleeves past the elbow',
    violation: 'the sleeves stop above the elbow',
  },
  {
    key: 'hemlineBelowKnee',
    label: 'Hemlines below the knee',
    detail: 'Midi, maxi and floor lengths only.',
    violation: 'the hemline sits above the knee',
  },
  { key: 'noTrousers', label: 'Skirts and dresses only', violation: 'it puts you in trousers' },
];

export const SOFT_RULES: ReadonlyArray<GuardrailRule> = [
  {
    key: 'noNeonColors',
    label: 'Quiet colour',
    detail: 'Leans to neutrals, earth and jewel tones.',
    violation: 'the colour runs neon',
  },
  {
    key: 'noLoudPrints',
    label: 'Restrained print',
    detail: 'Prefers solid and texture over bold pattern.',
    violation: 'the print is a loud one',
  },
];

export const HARD_KEYS: ReadonlyArray<HardGuardrailKey> = HARD_RULES.map(
  (rule) => rule.key as HardGuardrailKey,
);
export const SOFT_KEYS: ReadonlyArray<SoftGuardrailKey> = SOFT_RULES.map(
  (rule) => rule.key as SoftGuardrailKey,
);

/**
 * The minimum a look has to describe for its guardrails to be checked. A full
 * `FashionLook` satisfies this; so does the raw shape the model returns
 * before the client attaches price, tags and a fabric line to it — the API
 * route validates on exactly this partial shape, before those extras exist.
 */
export interface GuardrailSubject {
  top_garment: string;
  bottom_garment: string;
  dress_garment?: string;
  fabric?: string;
  tags?: readonly string[];
}

/**
 * Terms that violate "high necklines, full coverage, opaque fabric" on their
 * own — independent of sleeve length and hemline, which are separate rules
 * with separate toggles and must not be double-counted under this one.
 */
const IMMODEST_TERMS = [
  'sleeveless',
  'strapless',
  'backless',
  'low-cut',
  'low cut',
  'plunge',
  'sheer',
  'crop top',
  'cropped top',
  'bodycon',
  'off-shoulder',
  'off the shoulder',
  'bare midriff',
  'skin-tight',
];

function subjectText(subject: GuardrailSubject): string {
  return [
    subject.top_garment,
    subject.bottom_garment,
    subject.dress_garment ?? '',
    subject.fabric ?? '',
    (subject.tags ?? []).join(' '),
  ]
    .join(' ')
    .toLowerCase();
}

/**
 * Whether a single guardrail holds, read only from what the look itself
 * describes — never from a self-reported "compliance_check" the same model
 * that wrote the garment copy also wrote. A garment the model never
 * described as sleeved, ankle-length or trouser-free does not get the
 * benefit of the doubt: every check here fails closed on the language that
 * matters to it.
 */
export function holdsRule(key: GuardrailKey, subject: GuardrailSubject): boolean {
  const text = subjectText(subject);
  switch (key) {
    case 'modestWear':
      return !IMMODEST_TERMS.some((term) => text.includes(term));
    case 'sleevesBelowElbow':
      return text.includes('sleeve') && !text.includes('sleeveless');
    case 'hemlineBelowKnee':
      return !text.includes('mini') && !text.includes('above the knee');
    case 'noTrousers':
      return !text.includes('trouser');
    case 'noNeonColors':
      return !text.includes('neon');
    case 'noLoudPrints':
      return !text.includes('print');
  }
}

export interface GuardrailResult {
  rule: GuardrailRule;
  hard: boolean;
  held: boolean;
}

export interface GuardrailReport {
  /** Only guardrails the user actually switched on. */
  active: readonly GuardrailResult[];
  /** False the moment any active hard guardrail is missed. */
  passesHard: boolean;
  hardMissed: readonly string[];
  softMissed: readonly string[];
}

/**
 * Evaluate every guardrail the user has switched on against what the look
 * actually describes. This is the enforcement step the model's own claim
 * never was: it runs after the look exists, on the look's own words, and it
 * is what discovery and the API route both call before deciding what a
 * customer is allowed to see.
 */
export function evaluateLook(
  subject: GuardrailSubject,
  constraints: StyleConstraints,
): GuardrailReport {
  const active = [
    ...HARD_RULES.map((rule) => ({ rule, hard: true })),
    ...SOFT_RULES.map((rule) => ({ rule, hard: false })),
  ]
    .filter(({ rule }) => constraints[rule.key])
    .map(({ rule, hard }) => ({ rule, hard, held: holdsRule(rule.key, subject) }));

  const hardMissed = active.filter((r) => r.hard && !r.held).map((r) => r.rule.violation);
  const softMissed = active.filter((r) => !r.hard && !r.held).map((r) => r.rule.violation);

  return { active, passesHard: hardMissed.length === 0, hardMissed, softMissed };
}

/**
 * Fail closed. A look that misses an active hard guardrail is removed from
 * the list entirely — it is never a card the swipe deck can land on, and
 * never a look that can render with a "within your guardrails" badge next to
 * a rule it actually breaks.
 */
export function filterByHardGuardrails<T extends GuardrailSubject>(
  looks: readonly T[],
  constraints: StyleConstraints,
): T[] {
  return looks.filter((look) => evaluateLook(look, constraints).passesHard);
}

/**
 * The spend ceiling is a preference, not a guardrail — "Spend up to" never
 * rules a look out on its own, the way the Absolute plane does. This is the
 * disclosure half of that promise: callers use it to surface in-budget looks
 * first and to say so when the active look does not clear it, rather than
 * leaving the control's value connected to nothing.
 */
export function withinPriceCeiling(
  priceAED: number,
  constraints: Pick<StyleConstraints, 'maxPriceAED'>,
): boolean {
  return constraints.maxPriceAED === undefined || priceAED <= constraints.maxPriceAED;
}
