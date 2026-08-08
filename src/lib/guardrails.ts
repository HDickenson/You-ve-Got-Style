import { GarmentAttributes, Neckline, StyleConstraints } from '../types';

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
 * Runtime guard for the server boundary. `StyleConstraints` is a
 * compile-time type — an HTTP body can carry anything, including a
 * `MenswearStyleConstraints`-shaped object whose keys match none of the
 * rules above. Accepting that silently is how absence fails open at the
 * constraint layer: zero recognised keys means zero active rules means every
 * hard guardrail passes vacuously, on a wardrobe this module has no rule set
 * for. There is no menswear enforcement implemented yet, so a menswear (or
 * otherwise unrecognised) constraints body must be rejected here, not
 * accepted and left unenforced.
 */
export function isValidStyleConstraints(value: unknown): value is StyleConstraints {
  if (!value || typeof value !== 'object') return false;
  const c = value as Record<string, unknown>;
  if (c.wardrobe !== 'womenswear') return false;
  if (![...HARD_KEYS, ...SOFT_KEYS].every((key) => typeof c[key] === 'boolean')) return false;
  if (!Array.isArray(c.preferredFabrics) || !c.preferredFabrics.every((f) => typeof f === 'string')) {
    return false;
  }
  if (c.maxPriceAED !== undefined && typeof c.maxPriceAED !== 'number') return false;
  return true;
}

/**
 * The minimum a look has to state for its guardrails to be checked — discrete
 * facts, not prose to infer them from. A source that cannot answer "does this
 * cover the knee" except by writing a sentence about a garment is not a
 * source this can run against; `attributes` is required, not optional.
 */
export interface GuardrailSubject {
  attributes: GarmentAttributes;
  colorPalette: readonly string[];
}

/**
 * Necklines that satisfy "high necklines, full coverage" on their own —
 * independent of sleeve length and hemline, which are separate rules with
 * separate toggles and must not be double-counted under this one. An
 * allow-list, not a deny-list: a neckline this doesn't recognise fails
 * closed rather than passing by default because nobody thought to ban it.
 */
const MODEST_NECKLINES: ReadonlySet<Neckline> = new Set(['high', 'crew', 'scoop', 'v-neck']);

/**
 * Hex → HSL, thresholded. "Neon" is a fact about saturation and lightness a
 * swatch already carries, not a tag someone remembered to attach — reading
 * it here means a look tagged "Quiet colour" by mistake still gets caught,
 * and a look correctly tagged still gets caught if its actual hex disagrees.
 */
function isNeonColor(hex: string): boolean {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return false;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(match[1].slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  if (max === min) return false;
  const saturation = lightness > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
  return saturation > 0.75 && lightness > 0.45 && lightness < 0.85;
}

/**
 * Whether a single guardrail holds, read only from the look's own typed
 * attributes and colour data — never from a self-reported "compliance_check"
 * the same model that wrote the garment copy also wrote, and never from
 * scanning that copy for a keyword. A garment whose source did not state a
 * modest neckline, an elbow-or-longer sleeve or a below-knee hemline does
 * not get the benefit of the doubt.
 */
export function holdsRule(key: GuardrailKey, subject: GuardrailSubject): boolean {
  const a = subject.attributes;
  // A look whose source never populated `attributes` (the type promises it
  // is required; a caller upstream of this one is the one that broke that
  // promise) gets no benefit of the doubt — this fails closed instead of
  // throwing on `a.neckline`, which previously turned "guardrail switched on
  // after the fact" into a blank screen rather than a filtered look.
  if (!a && key !== 'noNeonColors') return false;
  switch (key) {
    case 'modestWear':
      return MODEST_NECKLINES.has(a.neckline) && a.opacity === 'opaque';
    case 'sleevesBelowElbow':
      return a.sleeveLength === 'elbow' || a.sleeveLength === 'three-quarter' || a.sleeveLength === 'long';
    case 'hemlineBelowKnee':
      // 'knee' sits at the knee, not below it — the rule's own copy promises
      // "Midi, maxi and floor lengths only," so accepting it here would be
      // enforcement that quietly disagrees with what the toggle says it does.
      return a.hemline === 'midi' || a.hemline === 'maxi' || a.hemline === 'floor';
    case 'noTrousers':
      return a.bottomCategory === 'skirt' || a.bottomCategory === 'dress';
    case 'noNeonColors':
      return !subject.colorPalette.some(isNeonColor);
    case 'noLoudPrints':
      return a.pattern !== 'printed';
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
 * actually states. This is the enforcement step the model's own claim never
 * was: it runs after the look exists, on the look's own typed facts, and it
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
