import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FashionLook, GarmentAttributes, StyleConstraints } from '../types';
import { SwipeDiscovery } from './SwipeDiscovery';

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
    look_title: 'Untitled Look',
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
    attributes: COMPLIANT_ATTRIBUTES,
    ...overrides,
  };
}

const noop = () => {};
const noopAsync = async () => {};
const capturedProfile = {
  frontPhoto: null,
  sidePhoto: null,
  heightCm: 170,
  timestamp: 0,
  isSensorVerified: false,
  isVoiceTriggered: false,
};

describe('SwipeDiscovery — fail-closed rendering', () => {
  it('never renders a look that breaks an active hard guardrail, even though the model marked it compliant', () => {
    // The model's self-reported `compliance_check: true` is exactly the claim
    // this whole guardrail system is not allowed to trust — the garment's own
    // typed attributes break four active hard guardrails at once.
    const violating = look({
      id: 'look-violating',
      look_title: 'Should Never Appear On Screen',
      compliance_check: true,
      attributes: {
        hemline: 'mini',
        sleeveLength: 'sleeveless',
        neckline: 'strapless',
        opacity: 'sheer',
        bottomCategory: 'trousers',
        pattern: 'printed',
      },
    });
    const compliant = look({ id: 'look-compliant', look_title: 'The Only Look Allowed To Show' });

    render(
      <SwipeDiscovery
        looks={[violating, compliant]}
        constraints={ALL_GUARDRAILS_ON}
        capturedProfile={capturedProfile}
        brandSizes={[]}
        onSwipeRight={noop}
        onSwipeLeft={noop}
        onBuyLook={noop}
        onFindLook={noopAsync}
        isFinding={false}
      />,
    );

    expect(screen.queryByText('Should Never Appear On Screen')).not.toBeInTheDocument();
    expect(screen.getByText('The Only Look Allowed To Show')).toBeInTheDocument();
  });

  it('shows the empty state instead of a violating look when nothing else qualifies', () => {
    const onlyViolating = look({
      id: 'look-violating',
      look_title: 'Should Never Appear On Screen',
      attributes: { ...COMPLIANT_ATTRIBUTES, bottomCategory: 'trousers' },
    });

    render(
      <SwipeDiscovery
        looks={[onlyViolating]}
        constraints={ALL_GUARDRAILS_ON}
        capturedProfile={capturedProfile}
        brandSizes={[]}
        onSwipeRight={noop}
        onSwipeLeft={noop}
        onBuyLook={noop}
        onFindLook={noopAsync}
        isFinding={false}
      />,
    );

    expect(screen.queryByText('Should Never Appear On Screen')).not.toBeInTheDocument();
    expect(screen.getByText('Nothing composed for this occasion yet.')).toBeInTheDocument();
  });

  it('does not crash — and does not render — a look whose attributes were never populated once a hard guardrail is active', () => {
    // Reproduces the reopening's F1: a look composed while every guardrail
    // was off can reach the deck without `attributes`; the crash only
    // surfaced once a hard rule was switched on and this component tried to
    // read `attributes.neckline` off it.
    const noAttributes = look({
      id: 'look-no-attributes',
      look_title: 'Should Never Appear On Screen',
      attributes: undefined as unknown as GarmentAttributes,
    });
    const compliant = look({ id: 'look-compliant', look_title: 'The Only Look Allowed To Show' });

    expect(() =>
      render(
        <SwipeDiscovery
          looks={[noAttributes, compliant]}
          constraints={ALL_GUARDRAILS_ON}
          capturedProfile={capturedProfile}
          brandSizes={[]}
          onSwipeRight={noop}
          onSwipeLeft={noop}
          onBuyLook={noop}
          onFindLook={noopAsync}
          isFinding={false}
        />,
      ),
    ).not.toThrow();

    expect(screen.queryByText('Should Never Appear On Screen')).not.toBeInTheDocument();
    expect(screen.getByText('The Only Look Allowed To Show')).toBeInTheDocument();
  });

  it('does not claim "Within your guardrails" when only a spend ceiling is set and no guardrail is switched on', () => {
    // F4: a spend ceiling is a preference, not a guardrail — it must not be
    // able to satisfy a badge that claims guardrails were verified.
    const compliant = look({ id: 'look-compliant', look_title: 'In Budget Look' });
    const noGuardrailsOnlyBudget: StyleConstraints = {
      wardrobe: 'womenswear',
      modestWear: false,
      sleevesBelowElbow: false,
      noTrousers: false,
      hemlineBelowKnee: false,
      noNeonColors: false,
      noLoudPrints: false,
      preferredFabrics: [],
      maxPriceAED: 50_000,
    };

    render(
      <SwipeDiscovery
        looks={[compliant]}
        constraints={noGuardrailsOnlyBudget}
        capturedProfile={capturedProfile}
        brandSizes={[]}
        onSwipeRight={noop}
        onSwipeLeft={noop}
        onBuyLook={noop}
        onFindLook={noopAsync}
        isFinding={false}
      />,
    );

    expect(screen.getByText('In Budget Look')).toBeInTheDocument();
    expect(screen.queryByText('Within your guardrails')).not.toBeInTheDocument();
  });
});
