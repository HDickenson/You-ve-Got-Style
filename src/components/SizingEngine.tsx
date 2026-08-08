import React, { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import {
  BrandSizeMapping,
  CapturedProfile,
  UserMeasurements,
  Wardrobe,
} from '../types';
import {
  estimateMeasurementsFromHeight,
  mapMeasurementsToBrandSizes,
} from '../data/brandGrading';
import { Display } from './brand';
import { Badge, Button, Card, Slider } from './ui';
import { ActionRow, AppContainer, ResponsiveGrid, Stack } from './layout';

interface SizingEngineProps {
  capturedProfile: CapturedProfile;
  wardrobe: Wardrobe;
  onProceedToGuardrails: (
    measurements: UserMeasurements,
    brandSizes: BrandSizeMapping[],
  ) => void;
}

interface EditableField {
  key: string;
  label: string;
  min: number;
  max: number;
}

/** Bust, waist and hip circumference carry the fit; inseam sets length. */
const WOMENSWEAR_FIELDS: EditableField[] = [
  { key: 'chestCm', label: 'Bust', min: 70, max: 130 },
  { key: 'waistCm', label: 'Waist', min: 55, max: 115 },
  { key: 'hipsCm', label: 'Hips', min: 75, max: 135 },
  { key: 'inseamCm', label: 'Inseam', min: 65, max: 100 },
];

/** Chest, waist, neck and sleeve carry the fit; hips are not a menswear cutting reference. */
const MENSWEAR_FIELDS: EditableField[] = [
  { key: 'chestCm', label: 'Chest', min: 80, max: 140 },
  { key: 'waistCm', label: 'Waist', min: 65, max: 125 },
  { key: 'neckCm', label: 'Neck', min: 33, max: 50 },
  { key: 'sleeveCm', label: 'Sleeve', min: 55, max: 72 },
  { key: 'inseamCm', label: 'Inseam', min: 68, max: 100 },
];

/**
 * The figure is a diagram, not a readout — the numbers live in the table below
 * where they can be tabular, selectable and read aloud. Eight-point type inside
 * an SVG is neither. `hips` is omitted for menswear rather than relabelled —
 * there is no menswear circumference at that position to show.
 */
function Figure({
  chest,
  waist,
  hips,
}: {
  chest: number;
  waist: number;
  hips?: number;
}) {
  const label =
    hips === undefined
      ? `Body diagram: chest ${chest} centimetres, waist ${waist} centimetres.`
      : `Body diagram: chest ${chest} centimetres, waist ${waist} centimetres, hips ${hips} centimetres.`;

  return (
    <svg
      viewBox="0 0 200 300"
      fill="none"
      role="img"
      aria-label={label}
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

      {/* The circumferences the grading actually turns on */}
      <g
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="3 3"
        className="text-fg/80"
      >
        <ellipse cx="100" cy="95" rx="32" ry="12" />
        <ellipse cx="100" cy="135" rx="24" ry="9" />
        {hips !== undefined ? (
          <ellipse cx="100" cy="175" rx="34" ry="14" />
        ) : null}
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
  wardrobe,
  onProceedToGuardrails,
}) => {
  // Seeded once from height, then owned here — every edit below moves this
  // state, never a fresh call back into the estimator.
  const [measurements, setMeasurements] = useState<UserMeasurements>(() =>
    estimateMeasurementsFromHeight(capturedProfile.heightCm, wardrobe),
  );
  // Which fields the customer has actually set, versus which are still the
  // height-derived guess. This is the fact "Estimated" vs "Yours" reads off —
  // never a copy decision made independently of it.
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>(
    {},
  );

  const brandSizes = useMemo(
    () => mapMeasurementsToBrandSizes(measurements),
    [measurements],
  );

  const fields =
    measurements.wardrobe === 'menswear' ? MENSWEAR_FIELDS : WOMENSWEAR_FIELDS;

  // Has the customer given us anything of their own yet? Drives the live
  // announcement below — before the first edit there is nothing to report.
  const anyTouched = Object.values(touchedFields).some(Boolean);

  const handleFieldChange = (key: string, value: number) => {
    setMeasurements((prev) => ({ ...prev, [key]: value }) as UserMeasurements);
    setTouchedFields((prev) => ({ ...prev, [key]: true }));
  };

  const hipsCm =
    measurements.wardrobe === 'womenswear' ? measurements.hipsCm : undefined;

  return (
    // Resolve, not Reveal: this is a computed result settling into place, not
    // imagery behind an aperture. Every screen either side of this one moves
    // on entry; this was the one silent cut in the flow.
    <AppContainer
      id="module-sizing-engine"
      className="motion-safe:animate-resolve py-8 md:py-12"
    >
      <Stack gap={48}>
        <Stack gap={16}>
          <span className="text-eyebrow font-medium uppercase text-fg-muted">
            Your fit
          </span>
          {/* The one editorial moment on this screen — a claim about the
              numbers below, true whether they are still the height-derived
              estimate or a tape measure has already corrected them. */}
          <Display>Your fit, in numbers.</Display>
          <p className="max-w-measure text-body text-fg-muted">
            Graded from your height against standard proportions — a starting
            point, not a tape measure. Adjust anything that's off below and
            every size updates with it.
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
                  hips={hipsCm}
                />
              </div>
            </div>
          </Card>

          <Stack gap={24} className="lg:justify-between">
            <Stack gap={4}>
              <span className="text-control font-medium uppercase text-fg-muted">
                Measurements
              </span>
              <p className="max-w-measure text-body text-fg-muted">
                Estimated until you say otherwise. Move any slider to give us
                your own number — the sizes below recalculate against it
                immediately.
              </p>
            </Stack>

            <div className="flex items-baseline justify-between gap-4 border-b border-rule py-3">
              <span className="text-body text-fg-muted">Height</span>
              <span className="text-price tabular text-fg">
                {measurements.heightCm} cm
              </span>
            </div>

            {/* One column under the thumb, two across a tablet. */}
            <div className="grid gap-x-12 gap-y-6 md:grid-cols-2">
              {fields.map((field) => {
                const value = (
                  measurements as unknown as Record<string, number>
                )[field.key];
                const isYours = touchedFields[field.key] === true;
                const sliderId = `sizing-${field.key}`;

                return (
                  <div
                    key={field.key}
                    className="md:[&:last-child:nth-child(odd)]:col-span-2"
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      <label
                        htmlFor={sliderId}
                        className="text-body text-fg-muted"
                      >
                        {field.label}
                      </label>
                      <span className="flex items-center gap-2">
                        {/* aria-hidden because the same distinction is carried
                            into the slider's own value announcement below. A
                            screen reader that read both would say "Yours"
                            twice for one field. */}
                        {/* Ink, not gold. Gold is rationed to selection,
                            completed intelligence and signature — and every
                            edited field taking a gold badge put four or five
                            gold moments on one screen. Per-field ownership is
                            a state, not a reveal. */}
                        <Badge
                          variant={isYours ? 'solid' : 'outline'}
                          aria-hidden="true"
                        >
                          {isYours ? 'Yours' : 'Estimated'}
                        </Badge>
                        <span
                          className="text-price tabular text-fg"
                          aria-hidden="true"
                        >
                          {value} cm
                        </span>
                      </span>
                    </div>
                    <Slider
                      id={sliderId}
                      className="mt-2"
                      min={field.min}
                      max={field.max}
                      value={value}
                      // The estimated/entered distinction is the whole point of
                      // this screen, and it used to live only in a coloured
                      // badge — a screen reader heard "Bust, 89" before and
                      // after editing, identically. Putting it in the value
                      // text means it is announced on the control the customer
                      // is actually operating, at the moment it changes.
                      aria-valuetext={`${value} centimetres, ${
                        isYours ? 'your measurement' : 'estimated from your height'
                      }`}
                      onValueChange={(next) =>
                        handleFieldChange(field.key, next)
                      }
                    />
                  </div>
                );
              })}
            </div>
          </Stack>
        </div>

        <Stack gap={24}>
          {/* The sizes below recompute silently as the sliders move. Sighted
              customers watch them change; without this nobody else is told.
              Polite so it waits for a pause rather than interrupting the value
              the customer is still adjusting. */}
          <p role="status" aria-live="polite" className="sr-only">
            {anyTouched
              ? `Sizes updated from your measurements. ${brandSizes
                  .map((item) => `${item.brandName} ${item.recommendedSize}`)
                  .join(', ')}.`
              : ''}
          </p>

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
