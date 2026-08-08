import { Overlay, type OverlayProps } from './overlay';

export type DialogProps = Omit<OverlayProps, 'placement'>;

/**
 * A centred, capped dialog at every size. Use it when the content is a
 * decision, not a workspace — otherwise reach for ResponsiveSheet, which meets
 * the phone at the bottom edge where a thumb already is.
 */
export function Dialog(props: DialogProps) {
  return <Overlay placement="center" {...props} />;
}
