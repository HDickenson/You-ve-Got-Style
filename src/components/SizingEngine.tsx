import React from 'react';
import { ArrowRight } from 'lucide-react';
import { UserMeasurements, WomenswearMeasurements, BrandSizeMapping, CapturedProfile } from '../types';
import {
  calculatePhotogrammetryMeasurements,
  mapMeasurementsToBrandSizes,
} from '../data/brandGrading';
import { Display } from './brand';
import { Badge, Button, Card } from './ui';
import { ActionRow, AppContainer, ResponsiveGrid, Stack } from './layout';

interface SizingEngineProps {
  capturedProfile: CapturedProfile;
  onProceedToGuardrails: (
    measurements: UserMeasurements,
    brandSizes: BrandSizeMapping[],
  ) => void;
}

/**
 * The figure is a diagram, not a readout — the numbers live in the table below
 * where they can be tabular, selectable and read aloud. Eight-point type inside
 * an SVG is neither.
 */
function Figure({ chest, waist, hips }: { chest: number; waist: number; hips: number }) {
  return (
    <svg
      viewBox="0 0 200 300"
      fill="none"
      role="img"
      aria-label={`Body diagram: chest ${chest} centimetres, waist ${waist} centimetres, hips ${hips} centimetres.`}
      className="size-full"
    >
      {/* Plumb line */}
      <line
        x1="100"
        y1="24"
        x2="100"
        y2="278"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeDasharray="2 6"
        className="text-fg/25"
      />

      {/* Contour */}
      <g stroke="currentColor" strokeWidth="1" className="text-fg/45">
        <path d="M 100 25 Q 85 45 75 70 Q 60 110 70 140 Q 62 180 75 220 L 80 275" />
        <path d="M 100 25 Q 115 45 125 70 Q 140 110 130 140 Q 138 180 125 220 L 120 275" />
        <path d="M 68 65 L 132 65" />
      </g>

      {/* The three circumferences the grading actually turns on */}
      <g
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="3 3"
        className="text-fg/80"
      >
        <ellipse cx="100" cy="95" rx="32" ry="12" />
        <ellipse cx="100" cy="135" rx="24" ry="9" />
        <ellipse cx="100" cy="175" rx="34" ry="14" />
      </g>

      {/* Inseam */}
      <line
        x1="100"
        y1="189"
        x2="100"
        y2="266"
        stroke="currentColor"
        strokeWidth="1"
        className="text-fg/45"
      />
    </svg>
  );
}

export const SizingEngine: React.FC<SizingEngineProps> = ({
  capturedProfile,
  onProceedToGuardrails,
}) => {
  // Still womenswear-only: this screen does not yet take a wardrobe prop
  // (that wiring is the Phase 1 form rebuild, tracked separately), so it
  // keeps calling the no-wardrobe overload and the concrete type it returns.
  const measurements: WomenswearMeasurements = calculatePhotogrammetryMeasurements(
    capturedProfile.heightCm,
  );
  const brandSizes: BrandSizeMapping[] = mapMeasurementsToBrandSizes(measurements);

  const rows: ReadonlyArray<{ label: string; value: number }> = [
    { label: 'Height', value: measurements.heightCm },
    { label: 'Chest', value: measurements.chestCm },
    { label: 'Waist', value: measurements.waistCm },
    { label: 'Hips', value: measurements.hipsCm },
    { label: 'Inseam', value: measurements.inseamCm },
  ];

  return (
    <AppContainer id="module-sizing-engine" className="py-8 md:py-12">
      <Stack gap={48}>
        <Stack gap={16}>
          <span className="text-eyebrow font-medium uppercase text-fg-muted">
            Your fit
          </span>
          {/* The one editorial moment on this screen: the reveal itself. */}
          <Display>This is your fit.</Display>
          <p className="max-w-measure text-body text-fg-muted">
            Graded from your height against standard proportions — a starting
            point, not a tape measure. Every look you are shown from here is cut
            to these numbers.
          </p>
        </Stack>

        {/* Tablet landscape sets the figure beside its numbers; portrait keeps
            the figure capped and centred and lets the table take the width. At
            lg: the panes are not top-aligned — the table distributes into the
            figure's height rather than leaving 170px of dead space beside it. */}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:gap-12">
          <Card className="mx-auto w-full max-w-[340px] lg:mx-0">
            <div className="relative aspect-[3/4] w-full p-6">
              {capturedProfile.frontPhoto ? (
                <img
                  src={capturedProfile.frontPhoto}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 size-full object-cover opacity-20"
                />
              ) : null}
              <div className="relative size-full text-fg">
                <Figure
                  chest={measurements.chestCm}
                  waist={measurements.waistCm}
                  hips={measurements.hipsCm}
                />
              </div>
            </div>
          </Card>

          <Stack gap={24} className="lg:justify-between">
            <span className="text-control font-medium uppercase text-fg-muted">
              Measurements
            </span>

            {/* One column under the thumb, two across a tablet — the table
                composes into the extra width instead of stretching one row.
                There are five measurements, so at two columns the last one
                would sit alone beside a dead cell; it spans the full width
                when it is the odd one out. */}
            <dl className="grid gap-x-12 md:grid-cols-2">
              {rows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-baseline justify-between gap-4 border-b border-rule py-3 md:[&:last-child:nth-child(odd)]:col-span-2"
                >
                  <dt className="text-body text-fg-muted">{row.label}</dt>
                  <dd className="text-price tabular text-fg">{row.value} cm</dd>
                </div>
              ))}
            </dl>

            <p className="max-w-measure text-body text-fg-muted">
              Measurements hold to the nearest centimetre. Adjust your height in
              the studio and every number here follows.
            </p>
          </Stack>
        </div>

        <Stack gap={24}>
          <Stack gap={8}>
            <span className="text-control font-medium uppercase text-fg-muted">
              Your size by house
            </span>
            <p className="max-w-measure text-body text-fg-muted">
              Each house cuts to its own chart. These are your sizes in theirs,
              and they travel with every look you are shown.
            </p>
          </Stack>

          <ResponsiveGrid gap={16}>
            {brandSizes.map((item) => (
              /* The size sits on its own row deliberately. A house name and a
                 badge sharing a line wrap at a third of a tablet landscape and
                 strand the badge under the name. */
              <Card key={item.brandName} className="p-6 md:p-8">
                <p className="min-w-0 text-body font-medium text-fg">
                  {item.brandName}
                </p>
                <p className="mt-2 text-eyebrow font-medium uppercase text-fg-muted">
                  {item.fitsToType}
                </p>
                <div className="mt-4">
                  <Badge variant="solid" className="tabular">
                    {item.recommendedSize}
                  </Badge>
                </div>
              </Card>
            ))}
          </ResponsiveGrid>
        </Stack>

        <ActionRow>
          <Button onClick={() => onProceedToGuardrails(measurements, brandSizes)}>
            Set your guardrails
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </ActionRow>
      </Stack>
    </AppContainer>
  );
};
