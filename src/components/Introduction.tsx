import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Square, Volume2 } from 'lucide-react';
import { Wardrobe } from '../types';
import { Display, YMark } from './brand';
import { Button } from './ui';
import { ActionRow, AppContainer, Stack } from './layout';
import { ChooseWardrobe } from './ChooseWardrobe';

interface IntroductionProps {
  /** The same handler App.tsx gives the standalone wardrobe screen and the
   *  reopen-from-menu sheet — this is a cold-start use of the one wardrobe
   *  choice, not a separate one, so it goes through the same code path
   *  (menswear's guardrail reset included) rather than a copy of it. */
  onSelectWardrobe: (choice: Wardrobe) => void;
}

type NarrationState = 'idle' | 'loading' | 'playing' | 'unavailable';

/** Mirrors INTRO_SCRIPT.welcome in server.ts exactly — read aloud by the
 *  narration when it plays, and always readable here regardless of whether
 *  it does. Two paths to the same words, not a script and its caption. */
const INTRO_TEXT =
  "You've Got Style is a stylist built around two things you set yourself: your fit, and your guardrails — what you will and won't wear. Tell it your height and what you're shopping for, set your guardrails once, and every look it finds is checked against them before it reaches you. Save what you like to a capsule, and check out when you're ready.";

/**
 * The voice-guided opening (D8), between the splash and consent. Two beats in
 * one component, the way HandsFreeCapture already holds its consent gate and
 * its capture view as two states of one screen rather than two routes.
 *
 * Voice-guided is not voice-controlled: the app *speaking* needs no consent,
 * only the app *listening* does (that gate is still HandsFreeCapture's, one
 * screen further on). So there is no permission prompt here — only a tap,
 * because a browser will not play audio before one. The tap is never assumed
 * on the customer's behalf; narration is opt-in, and the text above is the
 * whole introduction whether or not anyone ever taps it.
 */
export const Introduction: React.FC<IntroductionProps> = ({ onSelectWardrobe }) => {
  const [step, setStep] = useState<'welcome' | 'wardrobe'>('welcome');
  const [narration, setNarration] = useState<NarrationState>('idle');
  // Three seconds into `loading` with nothing back yet — the same visible
  // slow path SwipeDiscovery uses for style search, not a spinner pretending
  // to know how long a paid TTS call takes.
  const [narrationSlow, setNarrationSlow] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // The narration stops when the screen goes away, the same reasoning
  // HandsFreeCapture stops the camera stream on unmount.
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const listen = async () => {
    if (narration === 'loading' || narration === 'playing') return;
    setNarration('loading');
    setNarrationSlow(false);
    const slowTimer = window.setTimeout(() => setNarrationSlow(true), 3000);

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beat: 'welcome' }),
      });
      const data = await res.json();

      if (!res.ok || !data.audioBase64) {
        setNarration('unavailable');
        return;
      }

      const audio = new Audio(`data:${data.mimeType};base64,${data.audioBase64}`);
      audioRef.current = audio;
      audio.onended = () => setNarration('idle');
      audio.onerror = () => setNarration('unavailable');
      // Called from inside the tap handler, so the gesture every browser
      // requires before it will play audio is already satisfied here —
      // nothing upstream of this (the splash tap, the phase change) is asked
      // to carry it.
      await audio.play();
      setNarration('playing');
    } catch {
      setNarration('unavailable');
    } finally {
      window.clearTimeout(slowTimer);
    }
  };

  const stopListening = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    setNarration('idle');
  };

  const narrationStatus =
    narration === 'loading'
      ? narrationSlow
        ? 'Still preparing the narration.'
        : 'Preparing the narration.'
      : narration === 'unavailable'
        ? 'Narration is unavailable right now — the text above is the whole introduction.'
        : '';

  /* ------------------------------------------------------------ wardrobe */
  // The question moves here rather than standing as the front door (D8) —
  // ChooseWardrobe owns its own heading and gutters, so it is rendered
  // directly, the same way App.tsx renders the standalone phase.
  if (step === 'wardrobe') {
    return <ChooseWardrobe selected={null} onSelect={onSelectWardrobe} />;
  }

  /* -------------------------------------------------------------- welcome */
  return (
    <AppContainer id="module-introduction" className="py-8 md:py-12">
      <Stack gap={32}>
        <Stack gap={16}>
          <span className="text-eyebrow font-medium uppercase text-fg-muted">
            Before you shop
          </span>
          <Display>What You've Got Style does.</Display>
          <p className="max-w-measure text-body text-fg">{INTRO_TEXT}</p>
        </Stack>

        <Stack gap={12}>
          <div className="flex flex-wrap items-center gap-4">
            {narration === 'playing' ? (
              <Button variant="secondary" onClick={stopListening}>
                <Square className="size-4" aria-hidden="true" />
                Stop listening
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={listen}
                disabled={narration === 'loading'}
              >
                {narration === 'loading' ? (
                  <YMark className="h-4 w-auto motion-safe:animate-breath" />
                ) : (
                  <Volume2 className="size-4" aria-hidden="true" />
                )}
                {narration === 'loading'
                  ? 'Preparing…'
                  : narration === 'unavailable'
                    ? 'Narration unavailable'
                    : 'Listen instead'}
              </Button>
            )}
          </div>
          {/* A disabled button is dropped from the accessibility tree in
              several browsers, so the state it disables for is announced
              from its own region rather than relying on the label change
              above being read. */}
          <span role="status" aria-live="polite" className="sr-only">
            {narrationStatus}
          </span>
        </Stack>

        <ActionRow>
          <Button onClick={() => setStep('wardrobe')}>
            Continue
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </ActionRow>
      </Stack>
    </AppContainer>
  );
};
