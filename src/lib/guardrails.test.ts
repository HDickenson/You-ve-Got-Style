import { describe, expect, it } from 'vitest';
import { FashionLook, GarmentAttributes, StyleConstraints } from '../types';
import {
  evaluateLook,
  filterByHardGuardrails,
  holdsRule,
  isValidStyleConstraints,
  withinPriceCeiling,
} from './guardrails';

const ALL_GUARDRAILS_ON: StyleConstraints = {
  wardrobe: 'womenswear',
  modestWear: true,
  sleevesBelowElbow: true,
  noTrousers: true,
  hemlineBelowKnee: true,
  noNeonColors: true,
  noLoudPrints: true,
  preferredFabrics: [],
};

const COMPLIANT_ATTRIBUTES: GarmentAttributes = {
  hemline: 'floor',
  sleeveLength: 'long',
  neckline: 'high',
  opacity: 'opaque',
  bottomCategory: 'skirt',
  pattern: 'solid',
};

function look(overrides: Partial<FashionLook>): FashionLook {
  return {
    id: 'look-test',
    look_title: 'Test Look',
    occasion: 'Board Meeting',
    top_garment: 'Tailored Ivory Silk Crepe Blouse with High Stand Collar & Cuffed Long Sleeves',
    bottom_garment: 'Structured Navy Wool-Crepe Ankle-Length Column Skirt with High Waist',
    compliance_check: true,
    capsule_synergy: 'Pairs with everything.',
    brand: 'Atelier Édition',
    priceUSD: 1000,
    priceAED: 3670,
    fabric: '100% Mulberry Silk Crepe',
    colorPalette: ['#1A2B4C'],
    imageUrl: '/look-placeholder.svg',
    tags: ['Modest Wear'],
    attributes: COMPLIANT_ATTRIBUTES,
    ...overrides,
  };
}

describe('holdsRule — typed attributes, no prose parsing', () => {
  it('fails noTrousers when bottomCategory is trousers or jumpsuit', () => {
    expect(
      holdsRule('noTrousers', { attributes: { ...COMPLIANT_ATTRIBUTES, bottomCategory: 'trousers' }, colorPalette: [] }),
    ).toBe(false);
    expect(
      holdsRule('noTrousers', { attributes: { ...COMPLIANT_ATTRIBUTES, bottomCategory: 'jumpsuit' }, colorPalette: [] }),
    ).toBe(false);
  });

  it('passes noTrousers for a skirt or a dress', () => {
    expect(holdsRule('noTrousers', { attributes: COMPLIANT_ATTRIBUTES, colorPalette: [] })).toBe(true);
    expect(
      holdsRule('noTrousers', { attributes: { ...COMPLIANT_ATTRIBUTES, bottomCategory: 'dress' }, colorPalette: [] }),
    ).toBe(true);
  });

  it('fails sleevesBelowElbow for a sleeveless garment', () => {
    expect(
      holdsRule('sleevesBelowElbow', { attributes: { ...COMPLIANT_ATTRIBUTES, sleeveLength: 'sleeveless' }, colorPalette: [] }),
    ).toBe(false);
  });

  it('passes sleevesBelowElbow for elbow, three-quarter and long sleeves', () => {
    for (const sleeveLength of ['elbow', 'three-quarter', 'long'] as const) {
      expect(
        holdsRule('sleevesBelowElbow', { attributes: { ...COMPLIANT_ATTRIBUTES, sleeveLength }, colorPalette: [] }),
      ).toBe(true);
    }
  });

  it('fails modestWear on a plunge neckline even when opaque', () => {
    expect(
      holdsRule('modestWear', { attributes: { ...COMPLIANT_ATTRIBUTES, neckline: 'plunge' }, colorPalette: [] }),
    ).toBe(false);
  });

  it('fails modestWear on sheer fabric even with a high neckline', () => {
    expect(
      holdsRule('modestWear', { attributes: { ...COMPLIANT_ATTRIBUTES, opacity: 'sheer' }, colorPalette: [] }),
    ).toBe(false);
  });

  it('fails closed on an out-of-vocabulary neckline rather than passing by default', () => {
    const unrecognised = { ...COMPLIANT_ATTRIBUTES, neckline: 'sweetheart' as GarmentAttributes['neckline'] };
    expect(holdsRule('modestWear', { attributes: unrecognised, colorPalette: [] })).toBe(false);
  });

  it('reads noNeonColors from the actual hex, not a tag someone attached', () => {
    expect(holdsRule('noNeonColors', { attributes: COMPLIANT_ATTRIBUTES, colorPalette: ['#39FF14'] })).toBe(false);
    expect(holdsRule('noNeonColors', { attributes: COMPLIANT_ATTRIBUTES, colorPalette: ['#1A2B4C'] })).toBe(true);
  });

  it('fails noLoudPrints when pattern is printed', () => {
    expect(
      holdsRule('noLoudPrints', { attributes: { ...COMPLIANT_ATTRIBUTES, pattern: 'printed' }, colorPalette: [] }),
    ).toBe(false);
  });

  it('fails hemlineBelowKnee for a knee-length hemline — the rule promises midi, maxi and floor only', () => {
    expect(
      holdsRule('hemlineBelowKnee', { attributes: { ...COMPLIANT_ATTRIBUTES, hemline: 'knee' }, colorPalette: [] }),
    ).toBe(false);
  });

  it('fails closed rather than throwing when attributes were never populated', () => {
    // Mirrors a look whose source failed to state attributes at all — the
    // shape guardrails.ts's own type says is required, but a caller
    // upstream (or a malformed API response) can still hand over `undefined`.
    const subject = { attributes: undefined as unknown as GarmentAttributes, colorPalette: [] };
    expect(() => holdsRule('modestWear', subject)).not.toThrow();
    expect(holdsRule('modestWear', subject)).toBe(false);
    expect(holdsRule('sleevesBelowElbow', subject)).toBe(false);
    expect(holdsRule('hemlineBelowKnee', subject)).toBe(false);
    expect(holdsRule('noTrousers', subject)).toBe(false);
    expect(holdsRule('noLoudPrints', subject)).toBe(false);
  });

  it('never lets a look without attributes crash evaluateLook', () => {
    const noAttributesLook = { attributes: undefined as unknown as GarmentAttributes, colorPalette: [] };
    expect(() => evaluateLook(noAttributesLook, ALL_GUARDRAILS_ON)).not.toThrow();
    expect(evaluateLook(noAttributesLook, ALL_GUARDRAILS_ON).passesHard).toBe(false);
  });
});

describe('isValidStyleConstraints — the server boundary', () => {
  it('accepts a well-formed womenswear constraints object', () => {
    expect(isValidStyleConstraints(ALL_GUARDRAILS_ON)).toBe(true);
  });

  it('rejects a menswear-shaped constraints object rather than silently enforcing nothing', () => {
    // The exact shape of the adversarial probe from the reopening: a
    // constraints object whose keys match none of the womenswear rules
    // above, which previously produced zero active rules and passed every
    // hard guardrail vacuously.
    const menswearShaped = {
      wardrobe: 'menswear',
      modestWear: true,
      sleevesBelowElbow: true,
      coveredShoulders: true,
      kneesCovered: true,
      noShorts: true,
      relaxedSilhouette: true,
      traditionalFormalwearEligible: true,
      noNeonColors: true,
      noLoudPrints: true,
      preferredFabrics: [],
    };
    expect(isValidStyleConstraints(menswearShaped)).toBe(false);
  });

  it('rejects null, undefined, arrays and empty objects', () => {
    expect(isValidStyleConstraints(null)).toBe(false);
    expect(isValidStyleConstraints(undefined)).toBe(false);
    expect(isValidStyleConstraints([])).toBe(false);
    expect(isValidStyleConstraints({})).toBe(false);
  });

  it('rejects a constraints object with a non-boolean guardrail key', () => {
    expect(isValidStyleConstraints({ ...ALL_GUARDRAILS_ON, noTrousers: 'true' })).toBe(false);
  });

  it('rejects a maxPriceAED that is not a number', () => {
    expect(isValidStyleConstraints({ ...ALL_GUARDRAILS_ON, maxPriceAED: '5000' })).toBe(false);
    expect(isValidStyleConstraints({ ...ALL_GUARDRAILS_ON, maxPriceAED: 5000 })).toBe(true);
  });
});

describe('evaluateLook — the deliberately violating look', () => {
  // Exactly the shape a model could plausibly hand back while still setting
  // its own self-reported `compliance_check: true` — the whole point of code
  // enforcement is that this claim is never trusted, typed attributes or not.
  const violatingLook = look({
    attributes: {
      hemline: 'mini',
      sleeveLength: 'sleeveless',
      neckline: 'strapless',
      opacity: 'sheer',
      bottomCategory: 'trousers',
      pattern: 'printed',
    },
    compliance_check: true,
  });

  it('reports every active hard guardrail this look actually breaks', () => {
    const report = evaluateLook(violatingLook, ALL_GUARDRAILS_ON);
    expect(report.passesHard).toBe(false);
    expect(report.hardMissed).toEqual(
      expect.arrayContaining([
        'the cut is not a modest one',
        'the sleeves stop above the elbow',
        'it puts you in trousers',
        'the hemline sits above the knee',
      ]),
    );
  });

  it('is dropped from the eligible list entirely — never a card to render', () => {
    const compliantLook = look({ id: 'look-compliant' });
    const eligible = filterByHardGuardrails([violatingLook, compliantLook], ALL_GUARDRAILS_ON);

    expect(eligible.map((l) => l.id)).toEqual(['look-compliant']);
    expect(eligible.find((l) => l.id === violatingLook.id)).toBeUndefined();
  });

  it('ignores compliance_check entirely when deciding pass/fail', () => {
    const sameGarmentsHonestFlag = { ...violatingLook, compliance_check: false };
    const sameGarmentsDishonestFlag = { ...violatingLook, compliance_check: true };

    expect(evaluateLook(sameGarmentsHonestFlag, ALL_GUARDRAILS_ON).passesHard).toBe(false);
    expect(evaluateLook(sameGarmentsDishonestFlag, ALL_GUARDRAILS_ON).passesHard).toBe(false);
  });

  it('only filters on guardrails the user actually switched on', () => {
    const onlyNoTrousers: StyleConstraints = {
      ...ALL_GUARDRAILS_ON,
      modestWear: false,
      sleevesBelowElbow: false,
      hemlineBelowKnee: false,
    };
    const trouserLook = look({ attributes: { ...COMPLIANT_ATTRIBUTES, bottomCategory: 'trousers' } });

    expect(evaluateLook(trouserLook, onlyNoTrousers).passesHard).toBe(false);
    expect(evaluateLook(trouserLook, { ...onlyNoTrousers, noTrousers: false }).passesHard).toBe(true);
  });
});

describe('withinPriceCeiling', () => {
  it('never excludes when no ceiling is set', () => {
    expect(withinPriceCeiling(50_000, { maxPriceAED: undefined })).toBe(true);
  });

  it('is false once price clears the ceiling, without affecting hard-guardrail passage', () => {
    const overBudget = look({ priceAED: 20_000 });
    expect(withinPriceCeiling(overBudget.priceAED, { maxPriceAED: 5000 })).toBe(false);
    // Price is a soft preference — it never enters `evaluateLook`'s hard pass/fail.
    expect(evaluateLook(overBudget, ALL_GUARDRAILS_ON).passesHard).toBe(true);
  });
});
