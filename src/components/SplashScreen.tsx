import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Wordmark } from './brand';
import { Button } from './ui';
import { AppContainer, Stack } from './layout';

interface SplashScreenProps {
  onBegin: () => void;
}

/**
 * The literal first thing a customer sees (D8). Not the wardrobe question —
 * that used to open the app, and a form's opening is not an app's. This
 * screen asks nothing and claims nothing beyond the brand itself; what the
 * product does is the introduction's job, one tap away. No header, no menu —
 * there is nothing yet to navigate to.
 */
export const SplashScreen: React.FC<SplashScreenProps> = ({ onBegin }) => {
  return (
    <AppContainer
      as="section"
      aria-label="You've Got Style"
      className="flex flex-1 flex-col items-center justify-center gap-16 py-8 text-center md:py-12"
    >
      <Stack gap={16} align="center">
        <Wordmark variant="stacked" className="h-auto w-40 md:w-48" />
        <p className="text-eyebrow font-medium uppercase text-fg-muted">
          Personal styling, on your terms
        </p>
      </Stack>

      <Button size="lg" onClick={onBegin}>
        Begin
        <ArrowRight className="size-4" aria-hidden="true" />
      </Button>
    </AppContainer>
  );
};
