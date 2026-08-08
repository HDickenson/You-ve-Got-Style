import { Overlay, type OverlayProps } from './overlay';

export type ResponsiveSheetProps = Omit<OverlayProps, 'placement'>;

/**
 * One component, one DOM node, two behaviours:
 *
 * - phone — an edge-to-edge sheet rising from the bottom, rounded at the top
 *   only, capped at 85dvh so the ground behind it stays visible.
 * - md: and up — a centred dialog capped at 560px, rounded on all four
 *   corners, rising rather than sliding.
 *
 * Every flow that needs a product sheet, a checkout, or a settings panel uses
 * this rather than inventing its own.
 */
export function ResponsiveSheet(props: ResponsiveSheetProps) {
  return <Overlay placement="responsive" {...props} />;
}
