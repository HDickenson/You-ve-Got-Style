import React from 'react';
import { Bookmark, Trash2 } from 'lucide-react';
import { FashionLook } from '../types';
import { Button, Card, Separator } from './ui';
import { Price } from './brand';
import { ActionRow, AppContainer, ResponsiveGrid, Stack } from './layout';
import { formatAED } from '../lib/currency';

interface CapsuleWardrobeProps {
  savedLooks: FashionLook[];
  onRemoveLook: (lookId: string) => void;
  onBuyLook: (look: FashionLook) => void;
  onContinueShopping: () => void;
}

/**
 * The capsule is a working screen, not a reveal: cream ground, sans throughout,
 * no gold. The one editorial moment in this flow is spent on the confirmed
 * order in CheckoutModal, where it means something — a serif on every card
 * would make the serif furniture.
 *
 * Commerce sits beneath the styling experience: buying opens a sheet over this
 * screen (App owns it), it never navigates away from the capsule.
 */
export const CapsuleWardrobe: React.FC<CapsuleWardrobeProps> = ({
  savedLooks,
  onRemoveLook,
  onBuyLook,
  onContinueShopping,
}) => {
  const totalAED = savedLooks.reduce((sum, item) => sum + item.priceAED, 0);
  const count = savedLooks.length;

  const cards = savedLooks.map((look) => (
    <Card key={look.id} role="listitem" className="flex min-w-0 flex-col">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface">
        <img
          src={look.imageUrl}
          alt={look.look_title}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="size-full object-cover"
        />
      </div>

      <Stack gap={16} className="flex-1 p-6">
        <Stack gap={4}>
          <span className="text-eyebrow font-medium uppercase text-fg-muted">
            {look.brand}
          </span>
          <h2 className="text-body font-medium text-fg">{look.look_title}</h2>
          <p className="text-body text-fg-muted">{look.occasion}</p>
        </Stack>

        {/* Unclamped: this is the one line on the card that carries the
            reasoning, and half a sentence reasons about nothing. */}
        <p className="text-body text-fg-muted">{look.capsule_synergy}</p>

        <div className="mt-auto flex flex-col gap-4">
          <Separator />
          {/* At lg: the column is 293px and the price and the actions no
              longer share a line — so they wrap onto two rather than break
              the price across them. A price that wraps is not a price, and
              AED 13,200 is in the data. */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Price className="shrink-0">{formatAED(look.priceAED)}</Price>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemoveLook(look.id)}
                aria-label={`Remove ${look.look_title} from your capsule`}
              >
                <Trash2 className="size-5" aria-hidden="true" />
              </Button>
              <Button size="sm" onClick={() => onBuyLook(look)}>
                Buy look
              </Button>
            </div>
          </div>
        </div>
      </Stack>
    </Card>
  ));

  return (
    <AppContainer
      as="section"
      id="module-capsule-wardrobe"
      className="flex flex-1 flex-col gap-8 py-8 md:gap-12 md:py-12"
    >
      {/* Title and ledger sit side by side once there is a landscape to sit
          in — on phone the ledger is a band under the title. The ledger sits
          against the measure, not against the far viewport edge: a total
          belongs beside the thing it totals. */}
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:gap-12">
        <Stack gap={8}>
          <h1 className="text-screen font-medium text-fg">Your capsule</h1>
          {/* 46ch, not `max-w-measure`: 66ch measures ~88 characters in
              Instrument Sans, well past the 70 the contract allows. And with
              nothing saved this sentence describes pieces that do not exist —
              the empty state says it better. */}
          {count > 0 ? (
            <p className="max-w-[46ch] text-body text-fg-muted">
              Every piece here pairs with the others. Buy a look on its own, or
              keep building the set.
            </p>
          ) : null}
        </Stack>

        {count > 0 ? (
          <Stack
            gap={4}
            className="shrink-0 border-t border-rule pt-4 lg:border-t-0 lg:border-s lg:pt-0 lg:ps-8"
          >
            <span className="text-eyebrow font-medium uppercase text-fg-muted">
              {count === 1 ? '1 look saved' : `${count} looks saved`}
            </span>
            <Price className="font-medium">{formatAED(totalAED)}</Price>
          </Stack>
        ) : null}
      </header>

      {count === 0 ? (
        <div className="flex flex-1 items-center justify-center py-12">
          <Stack gap={24} align="center" className="max-w-[46ch] text-center">
            <Bookmark
              className="size-8 text-fg-muted"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <Stack gap={8}>
              {/* Sits under "Your capsule", so it reads at body weight — two
                  screen titles on one screen is two first sentences. */}
              <h2 className="text-body font-medium text-fg">
                Nothing saved yet
              </h2>
              <p className="text-body text-fg-muted">
                Keep the looks you would actually wear and they collect here,
                with the pieces that work alongside them.
              </p>
            </Stack>
            <Button onClick={onContinueShopping}>Find your first look</Button>
          </Stack>
        </div>
      ) : (
        <>
          {/* The track count follows the contents. Three empty columns beside
              one card is the ocean of dead space the contract names, and the
              first view of this screen is usually a capsule of one: a single
              look is centred and capped so its 4:5 plate stays editorial, two
              looks make a pair at md: and hold it at lg:, and only from three
              does the third track earn its place. */}
          {count === 1 ? (
            <div
              role="list"
              aria-label="Saved looks"
              className="mx-auto w-full max-w-[420px]"
            >
              {cards}
            </div>
          ) : (
            <ResponsiveGrid
              gap={24}
              maxColumns={count === 2 ? 2 : 3}
              aria-label="Saved looks"
              role="list"
            >
              {cards}
            </ResponsiveGrid>
          )}

          {/* One screen-level action, capped and thumb-reachable. */}
          <ActionRow align="center">
            <Button
              id="btn-return-discovery"
              variant="secondary"
              onClick={onContinueShopping}
              className="w-full md:w-auto"
            >
              Find more looks
            </Button>
          </ActionRow>
        </>
      )}
    </AppContainer>
  );
};
