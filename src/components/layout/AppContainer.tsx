import { cn } from '../../lib/cn';
import type { ElementProps } from '../../lib/props';

export type ContainerWidth = 'app' | 'measure' | 'action' | 'full';

const WIDTH: Record<ContainerWidth, string> = {
  /** Content cap on tablet landscape — extra space becomes margin, not line length. */
  app: 'max-w-app',
  /** Prose. Never past ~70 characters, at any size. */
  measure: 'max-w-measure',
  /** An action row. Three buttons never spread across a tablet. */
  action: 'max-w-action',
  full: '',
};

export interface AppContainerProps extends ElementProps {
  as?: any;
  width?: ContainerWidth;
}

/**
 * Page gutters and a measure cap, in one place so no screen invents its own.
 * Gutters are 24 / 32 / 48 at phone / tablet portrait / tablet landscape, and
 * grow further to clear a notch in landscape.
 */
export function AppContainer({
  as: Component = 'div',
  width = 'app',
  className,
  ...props
}: AppContainerProps) {
  return (
    <Component
      data-slot="app-container"
      className={cn('safe-inline mx-auto w-full', WIDTH[width], className)}
      {...props}
    />
  );
}
