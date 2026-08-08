import React, { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { FashionLook, BrandSizeMapping } from '../types';
import { Button, ResponsiveSheet, Separator } from './ui';
import { OccasionTitle, Price } from './brand';
import { Stack } from './layout';
import { cn } from '../lib/cn';
import type { ElementProps } from '../lib/props';
import { formatAED } from '../lib/currency';

interface CheckoutModalProps {
  look: FashionLook | null;
  brandSizes: BrandSizeMapping[];
  onClose: () => void;
}

/** Where the courier would go. No timings: there is no logistics integration
 *  behind this, and "Same day" is a promise nothing in this system can keep.
 *  The cities are real choices; the speed was decoration. */
const DESTINATIONS: ReadonlyArray<{ city: string }> = [
  { city: 'Dubai' },
  { city: 'Abu Dhabi' },
  { city: 'Riyadh' },
  { city: 'Jeddah' },
  { city: 'Doha' },
  { city: 'Kuwait City' },
];

/** Wide-tracked uppercase, the label voice for every section on this sheet. */
function SectionLabel({ children }: ElementProps) {
  return (
    <span className="text-eyebrow font-medium uppercase text-fg-muted">
      {children}
    </span>
  );
}

/** A ledger line: label left, figure right, figures on the decimal. */
function DetailRow({ label, value }: ElementProps) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="min-w-0 text-body text-fg-muted">{label}</span>
      <span className="shrink-0 text-body tabular text-fg">{value}</span>
    </div>
  );
}

/**
 * Commerce lives beneath the styling experience: a sheet rising over whatever
 * the user was looking at on phone, a 560px centred dialog from md: — never a
 * navigation away. ResponsiveSheet owns both behaviours.
 *
 * The one editorial moment in this flow is spent here, on the confirmed order.
 */
export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  look,
  brandSizes,
  onClose,
}) => {
  const [isOrdered, setIsOrdered] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [city, setCity] = useState<string>(DESTINATIONS[0].city);

  // The sheet animates out after `look` has already gone back to null, so the
  // last look is held here — otherwise the panel empties before it leaves.
  const [shown, setShown] = useState<FashionLook | null>(look);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    // Closing mid-confirm must not land the success state on the panel while
    // it is still animating out.
    clearTimeout(timer.current);
    setIsProcessing(false);
    if (!look) return;
    setShown(look);
    setIsOrdered(false);
  }, [look]);

  if (!shown) return null;

  // One brand is being bought, so one size is answered from the customer's
  // own computed table — never a literal stamped on the look, which would go
  // stale the moment the customer edits a measurement. The rest of the
  // grading table is a size chart, and a size chart is not a concierge.
  const sizeValue =
    brandSizes.find((entry) => entry.brandName === shown.brand)
      ?.recommendedSize ?? 'Your measured size';

  const pieces = [
    shown.dress_garment,
    shown.top_garment,
    shown.bottom_garment,
  ].filter(Boolean) as string[];

  const confirm = () => {
    setIsProcessing(true);
    timer.current = setTimeout(() => {
      setIsProcessing(false);
      setIsOrdered(true);
    }, 1200);
  };

  return (
    <ResponsiveSheet
      open={Boolean(look)}
      onOpenChange={(next: boolean) => {
        if (!next) onClose();
      }}
      ground="cream"
      // The header is chrome, not the announcement: on confirmation the serif
      // below says it, and a 22px sans headline landing first would blunt the
      // one editorial moment the whole flow saves up for. The title stays
      // because it names the dialog and carries the close control with it.
      title="Checkout"
      description={
        isOrdered ? undefined : 'Nothing here is reserved. This is a demonstration checkout.'
      }
      footer={
        isOrdered ? (
          <Button
            id="btn-close-confirmed"
            onClick={onClose}
            className="w-full md:w-auto"
          >
            Done
          </Button>
        ) : (
          <>
            {/* The label stays put: a control that is disabled drops out of the
                accessibility tree in several browsers, so a label that changes
                as the button disables can announce nothing at all. */}
            <span
              role="status"
              className="text-eyebrow font-medium uppercase text-fg-muted"
            >
              {isProcessing ? 'Preparing your summary' : ''}
            </span>
            <Button
              id="btn-confirm-purchase"
              onClick={confirm}
              disabled={isProcessing}
              className="w-full md:w-auto"
            >
              Confirm purchase
            </Button>
          </>
        )
      }
    >
      {isOrdered ? (
        <Stack gap={24} align="center" className="animate-resolve text-center">
          {/* The single gold moment in the flow — a completed order. It carries
              an ink ring because gold on cream is 2.01:1 on its own. */}
          <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-gold text-on-gold ring-1 ring-fg">
            <Check className="size-6" strokeWidth={1.5} aria-hidden="true" />
          </span>

          <Stack gap={12} align="center">
            <OccasionTitle as="p">{shown.look_title}, ready to order.</OccasionTitle>
            <p className="max-w-measure text-body text-fg-muted">
              This is where it would go. Nothing has been ordered, charged or shipped —
              this checkout is a demonstration.
            </p>
          </Stack>

          <Stack gap={12} className="w-full border-y border-rule py-6 text-start">
            {/* No order number. There is no order, and a fixed literal that never
                changes between checkouts is the clearest kind of fiction. */}
            <DetailRow label={shown.brand} value={sizeValue} />
            <DetailRow label="Would cost" value={formatAED(shown.priceAED)} />
          </Stack>
        </Stack>
      ) : (
        <Stack gap={32}>
          {/* What is being bought. 3:4 plate, capped — it stays a thumbnail on
              a 560px dialog rather than growing into the panel. */}
          <div className="flex gap-4">
            <img
              src={shown.imageUrl}
              alt={shown.look_title}
              referrerPolicy="no-referrer"
              className="aspect-[3/4] w-24 shrink-0 rounded-control border border-rule object-cover md:w-28"
            />
            <Stack gap={4} className="min-w-0 flex-1">
              <SectionLabel>{shown.brand}</SectionLabel>
              <h3 className="text-body font-medium text-fg">
                {shown.look_title}
              </h3>
              <p className="text-body text-fg-muted">{shown.occasion}</p>
            </Stack>
          </div>

          <Stack gap={12}>
            <SectionLabel>The pieces</SectionLabel>
            <Separator />
            <ul className="flex flex-col gap-3">
              {pieces.map((piece) => (
                <li key={piece} className="text-body text-fg">
                  {piece}
                </li>
              ))}
            </ul>
          </Stack>

          <Stack gap={12}>
            <SectionLabel>Your size</SectionLabel>
            <Separator />
            <DetailRow label={shown.brand} value={sizeValue} />
          </Stack>

          {/* Six destinations, laid out rather than hidden in a dropdown —
              a dropdown as a general-purpose control is deliberately absent.
              One column on phone, two from md:. */}
          <Stack gap={12}>
            <SectionLabel>Delivered to</SectionLabel>
            <Separator />
            <div
              role="radiogroup"
              aria-label="Delivery destination"
              className="grid grid-cols-1 gap-3 md:grid-cols-2"
            >
              {DESTINATIONS.map((destination) => {
                const selected = destination.city === city;
                return (
                  // A real radio, visually hidden: arrow-key navigation inside
                  // the group comes free, which a div full of buttons does not
                  // get. The label carries the focus ring on its behalf.
                  <label
                    key={destination.city}
                    className={cn(
                      'flex min-h-14 cursor-pointer items-center justify-between gap-3',
                      'rounded-control border px-4 py-3',
                      'transition-colors duration-shift ease-shift',
                      'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-fg',
                      selected
                        ? 'border-fg'
                        : 'border-control hoverable:hover:border-fg',
                    )}
                  >
                    <input
                      type="radio"
                      name="delivery-destination"
                      value={destination.city}
                      checked={selected}
                      onChange={() => setCity(destination.city)}
                      className="sr-only"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-body text-fg">
                        {destination.city}
                      </span>
                    </span>
                    {selected ? (
                      // Marking the selection is exactly what gold is for. On
                      // cream gold is 2.01:1, so the ink ring does the 3:1.
                      <span
                        className="size-2 shrink-0 rounded-full bg-gold ring-1 ring-fg"
                        aria-hidden="true"
                      />
                    ) : null}
                  </label>
                );
              })}
            </div>
          </Stack>

          <Stack gap={12}>
            <Separator />
            <DetailRow label="Subtotal" value={formatAED(shown.priceAED)} />
            <DetailRow label="Delivery" value="Not calculated" />
            <div className="flex items-baseline justify-between gap-4 border-t border-rule pt-3">
              <span className="text-body font-medium text-fg">Total</span>
              <Price className="font-medium">{formatAED(shown.priceAED)}</Price>
            </div>
          </Stack>
        </Stack>
      )}
    </ResponsiveSheet>
  );
};
