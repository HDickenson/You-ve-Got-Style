import { Overlay, type OverlayProps } from './overlay';

export type SheetSide = 'bottom' | 'left';

export interface SheetProps extends Omit<OverlayProps, 'placement'> {
  /**
   * `bottom` — a sheet rising from the thumb edge.
   * `left` — the drawer: full-screen on phone, a 420px side panel from md:.
   */
  side?: SheetSide;
}

export function Sheet({ side = 'bottom', ...props }: SheetProps) {
  return <Overlay placement={side} {...props} />;
}
