import { describe, expect, it } from 'vitest';
import { FashionLook, StyleConstraints } from '../types';
import { evaluateLook, filterByHardGuardrails, holdsRule, withinPriceCeiling } from './guardrails';

const ALL_GUARDRAILS_ON: StyleConstraints = {
  modestWear: true,
  sleevesBelowElbow: true,
  noTrousers: true,
  hemlineBelowKnee: true,
  noNeonColors: true,
  noLoudPrints: true,
  preferredFabrics: [],
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
    brand_sizes: [],
    ...overrides,
  };
}

describe('holdsRule', () => {
  it('fails noTrousers when the copy names trousers', () => {
    expect(holdsRule('noTrousers', { top_garment: '', bottom_garment: 'Wide-Leg Trousers' })).toBe(false);
  });

  it('does not let "sleeveless" satisfy sleevesBelowElbow via substring match', () => {
    expect(
      holdsRule('sleevesBelowElbow', { top_garment: 'Sleeveless Silk Top', bottom_garment: '' }),
    ).toBe(false);
  });

  it('passes sleevesBelowElbow when the copy actually describes sleeves', () => {
    expect(
      holdsRule('sleevesBelowElbow', { top_garment: 'Long Sleeve Blouse', bottom_garment: '' }),
    ).toBe(true);
  });

  it('fails modestWear on immodest cut language, independent of compliance_check', () => {
    expect(
      holdsRule('modestWear', { top_garment: 'Strapless Sheer Bodycon Top', bottom_garment: '' }),
    ).toBe(false);
  });
});

describe('evaluateLook — the deliberately violating look', () => {
  // Exactly the shape a model could plausibly hand back while still setting
  // its own self-reported `compliance_check: true` — the whole point of code
  // enforcement is that this claim is never trusted.
  const violatingLook = look({
    top_garment: 'Sleeveless Strapless Silk Camisole',
    bottom_garment: 'Cropped Neon Wide-Leg Trousers with Mini Hem',
    compliance_check: true,
    tags: ['Evening', 'Bold Print'],
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
    const trouserLook = look({ bottom_garment: 'Tailored Trousers' });

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
