import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Upload } from 'lucide-react';
import { CapturedProfile } from '../types';
import { Display, OccasionTitle, YMark } from './brand';
import { Button, Card, CardContent, Slider, Switch } from './ui';
import { ActionRow, AppContainer, Stack } from './layout';
import { DURATION } from '../lib/motion';
import { cn } from '../lib/cn';

interface HandsFreeCaptureProps {
  onCaptureComplete: (profile: CapturedProfile) => void;
  heightCm: number;
  setHeightCm: (height: number) => void;
}

/** Upright and level, within a tight camera-alignment tolerance. */
const PITCH_TARGET = 90;
const TOLERANCE = 3;
const PITCH_MIN = 70;
const PITCH_MAX = 110;
const ROLL_RANGE = 20;

/** Alignment has to hold for a beat before it counts — a live sensor sitting on
 *  the tolerance boundary would otherwise flap the gold and re-announce the
 *  instruction every few hundred milliseconds. */
const SETTLE_MS = DURATION.resolve * 1000;

/** How long a live sensor gets to settle on its own before the reader is
 *  offered a way out. A tablet propped in a stand can sit at a fixed recline
 *  that never crosses the tolerance band — that reader needs a path forward,
 *  not an indefinite wait on a reading that will never change. */
const GRACE_MS = 6000;

/** The grabbed still holds in the viewfinder — the Reveal, then the same again
 *  to look at what was taken — before the live preview comes back. */
const HOLD_MS = DURATION.reveal * 2000;

/**
 * The promises the gate is asking the reader to accept. Three, plainly stated —
 * a consent screen that lists nothing is a formality with a switch on it. Each
 * one is a statement this codebase actually keeps: the sizing is computed here
 * from height alone, the frames are never written anywhere, and the one moment
 * a frame leaves the device is named rather than buried two screens later.
 */
const PROMISES: ReadonlyArray<{ title: string; body: string }> = [
  {
    title: 'Sized on this device',
    body: 'Your height is what sizes you, and that is worked out here. Nothing is sent to measure you.',
  },
  {
    title: 'Never written down',
    body: 'The frames are held for this session only. Retake replaces them, and closing the app ends them.',
  },
  {
    title: 'Sent only when you ask',
    body: 'To show a look on you, one frame is sent away to be rendered. That happens when you ask for a look, and never otherwise.',
  },
];

/**
 * A hairline instrument, and only that: a mark travelling toward a target. It
 * does not report degrees — a decimal readout is a system report, and the frame
 * itself already says whether it is level. The indicator is the ground's own
 * ink at every position, because gold on this screen is spent once, inside the
 * frame, on the silhouette.
 */
function Gauge({
  label,
  value,
  min,
  max,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
}) {
  const percent = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);

  return (
    <div className="flex items-center gap-4">
      <span className="w-14 shrink-0 text-eyebrow font-medium uppercase text-fg-muted">
        {label}
      </span>

      <div className="relative h-6 min-w-0 flex-1" aria-hidden="true">
        <span className="absolute inset-x-0 top-1/2 block h-px -translate-y-1/2 bg-rule" />
        {/* The target, marked once in the middle of the run. */}
        <span className="absolute top-1/2 start-1/2 block h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-fg-muted" />
        <span
          className="absolute top-1/2 block h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fg transition-[inset-inline-start] duration-resolve ease-resolve"
          style={{ insetInlineStart: `${percent}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Stitch's abstract figure, redrawn on brand: hairline, dashed, never filled.
 * It is a framing guide over a live room, not decoration, so it is drawn to
 * survive daylight and sized to teach the distance the reader is asked to
 * stand at — a guide they are told to fill has to look fillable.
 */
function Silhouette({ aligned }: { aligned: boolean }) {
  return (
    <svg
      viewBox="0 0 200 400"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cn(
        'h-[92%] w-auto transition-colors duration-resolve ease-resolve',
        aligned ? 'text-gold' : 'text-fg/60',
      )}
    >
      <path
        d="M100 20 C120 20, 130 40, 130 60 C130 80, 110 90, 100 90 C90 90, 70 80, 70 60 C70 40, 80 20, 100 20 Z"
        stroke="currentColor"
        strokeDasharray="2 8"
        strokeWidth="1"
      />
      <path
        d="M100 100 L140 120 L130 250 L100 380 L70 250 L60 120 Z"
        stroke="currentColor"
        strokeDasharray="2 8"
        strokeWidth="1"
      />
      <path
        d="M60 120 L30 180 M140 120 L170 180"
        stroke="currentColor"
        strokeDasharray="2 8"
        strokeWidth="1"
      />
    </svg>
  );
}

const CORNER = [
  'top-4 start-4 border-t border-s',
  'top-4 end-4 border-t border-e',
  'bottom-4 start-4 border-b border-s',
  'bottom-4 end-4 border-b border-e',
];

export const HandsFreeCapture: React.FC<HandsFreeCaptureProps> = ({
  onCaptureComplete,
  heightCm,
  setHeightCm,
}) => {
  // The gate. Nothing below it runs — no sensor reading is acted on, no camera
  // permission is requested — until the reader has actually said yes.
  const [agreed, setAgreed] = useState<boolean>(false);
  // Separate from `agreed` on purpose. Speech recognition sends audio off the
  // device; the camera toggle cannot stand in for permission to do that.
  const [voiceAgreed, setVoiceAgreed] = useState<boolean>(false);
  const [consented, setConsented] = useState<boolean>(false);

  // Sensors. Pitch is front-to-back tilt, roll is side-to-side.
  const [pitch, setPitch] = useState<number>(82);
  const [roll, setRoll] = useState<number>(0);
  const [sensorLive, setSensorLive] = useState<boolean>(false);

  // The way out for a reader whose live sensor is never going to settle — a
  // stand holds its recline, it does not drift toward level. Offered only
  // after a grace period, and only while genuinely stuck, so it never
  // preempts a sensor that is about to succeed on its own.
  const [overrideAvailable, setOverrideAvailable] = useState<boolean>(false);
  const [manualOverride, setManualOverride] = useState<boolean>(false);
  const manualOverrideRef = useRef(false);
  useEffect(() => {
    manualOverrideRef.current = manualOverride;
  }, [manualOverride]);

  // Capture. The frames start empty: a stock photograph of a stranger standing
  // in for the reader's own body is not a placeholder, it is a lie with a face.
  const [frontPhoto, setFrontPhoto] = useState<string | null>(null);
  const [sidePhoto, setSidePhoto] = useState<string | null>(null);
  const [heldFrame, setHeldFrame] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraBlocked, setCameraBlocked] = useState<boolean>(false);
  const [listening, setListening] = useState<boolean>(false);
  const [voiceUsed, setVoiceUsed] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const holdRef = useRef<number | null>(null);

  const withinTolerance =
    Math.abs(pitch - PITCH_TARGET) <= TOLERANCE && Math.abs(roll) <= TOLERANCE;

  // Alignment the screen acts on: the reading has to hold, not merely touch the
  // boundary. Everything the reader sees or hears — the silhouette, the pill,
  // the spoken instruction, the shutter — waits for this rather than the raw
  // sensor, so a phone resting at 87.2° does not strobe.
  const [aligned, setAligned] = useState<boolean>(false);
  useEffect(() => {
    const settle = window.setTimeout(() => setAligned(withinTolerance), SETTLE_MS);
    return () => window.clearTimeout(settle);
  }, [withinTolerance]);

  // A live sensor that hasn't aligned after a full grace period is treated as
  // stuck, not slow — offer the manual override rather than leaving the
  // reader waiting on a reading that a propped device will never produce.
  useEffect(() => {
    if (!sensorLive || aligned) {
      setOverrideAvailable(false);
      return;
    }
    const grace = window.setTimeout(() => setOverrideAvailable(true), GRACE_MS);
    return () => window.clearTimeout(grace);
  }, [sensorLive, aligned]);

  const step: 'front' | 'side' | 'ready' = !frontPhoto
    ? 'front'
    : !sidePhoto
      ? 'side'
      : 'ready';

  // Accelerometer / gyroscope, where the device has one. Where it does not, the
  // reader levels the frame by hand and the screen says so rather than
  // pretending a sensor is reporting.
  useEffect(() => {
    if (!consented) return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.beta === null && event.gamma === null) return;
      setSensorLive(true);
      if (event.beta !== null && !manualOverrideRef.current) {
        setPitch(Math.round(Math.abs(event.beta) * 10) / 10);
      }
      if (event.gamma !== null) setRoll(Math.round(event.gamma * 10) / 10);
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [consented]);

  // The camera stops when the screen goes away. Without this the indicator light
  // stays on after the reader has moved to their measurements.
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (holdRef.current !== null) window.clearTimeout(holdRef.current);
    };
  }, []);

  // The stream is opened from the consent gate, where there is no <video> yet
  // to hand it to. Attaching here — after the viewfinder has mounted — is what
  // makes the preview appear rather than a permanently black frame.
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive]);

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      });
      streamRef.current = stream;
      setCameraActive(true);
      setCameraBlocked(false);
    } catch {
      // No camera, or the reader declined at the OS prompt. Upload still works.
      setCameraActive(false);
      setCameraBlocked(true);
    }
  };

  const grantConsent = () => {
    setConsented(true);
    void openCamera();
  };

  /** A still off the live preview — what "captured" has to mean to be true. */
  const grabFrame = (): string | null => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.9);
  };

  const takeFrame = () => {
    const shot = grabFrame();
    if (!shot) return;
    if (step === 'front') setFrontPhoto(shot);
    else if (step === 'side') setSidePhoto(shot);

    // The frame the reader just gave is shown back to them, in the viewfinder,
    // as a Reveal — a capture that changes nothing on screen but a checkmark
    // eleven pixels tall is not a capture the reader can believe in.
    setHeldFrame(shot);
    if (holdRef.current !== null) window.clearTimeout(holdRef.current);
    holdRef.current = window.setTimeout(() => setHeldFrame(null), HOLD_MS);
  };

  const listen = () => {
    // No voice consent, no microphone. The button is still the shutter, so
    // the customer loses nothing but the hands-free part they declined.
    if (!voiceAgreed) {
      takeFrame();
      return;
    }

    setListening(true);

    const Recognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!Recognition) {
      // No speech engine: the same button is still the shutter.
      setListening(false);
      takeFrame();
      return;
    }

    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const heard = String(event.results[0][0].transcript).toLowerCase();
      setListening(false);
      if (/snap|shoot|take|cheese/.test(heard)) {
        setVoiceUsed(true);
        takeFrame();
      }
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognition.start();
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (step === 'front') setFrontPhoto(result);
      else setSidePhoto(result);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const retake = () => {
    setFrontPhoto(null);
    setSidePhoto(null);
    setHeldFrame(null);
    setVoiceUsed(false);
  };

  const finish = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    onCaptureComplete({
      frontPhoto,
      sidePhoto,
      heightCm,
      timestamp: Date.now(),
      // A reading set by hand — whether because there was never a sensor, or
      // because a live one was overridden — is not a sensor verifying the
      // frame. Only an unoverridden live sensor settling in tolerance is.
      isSensorVerified: aligned && sensorLive && !manualOverride,
      isVoiceTriggered: voiceUsed,
    });
  };

  const instruction = listening
    ? 'Listening.'
    : heldFrame
      ? 'Held.'
      : !aligned
        ? 'Stand the phone up and let it settle level.'
        : step === 'front'
          ? 'Step back until the outline holds you, then say “Snap”.'
          : step === 'side'
            ? 'Turn a quarter turn to your right, then say “Snap” again.'
            : 'Both frames are held. Your fit is ready to read.';

  /* ---------------------------------------------------------------- consent */

  if (!consented) {
    return (
      <AppContainer id="module-handsfree-capture" className="py-8 md:py-12">
        <Stack gap={32}>
          <div className="grid gap-8 lg:grid-cols-2 lg:items-start lg:gap-12">
            <Stack gap={16}>
              <span className="text-eyebrow font-medium uppercase text-fg-muted">
                Before we begin
              </span>
              {/* The one editorial moment on this screen, and it has to be a
                  sentence the code keeps: the camera opens only after the
                  switch, and a frame is sent only when a look is asked for. */}
              <Display>Nothing leaves this device unless you ask.</Display>
              <p className="max-w-measure text-body text-fg-muted">
                Your height sizes you. Two frames are so a look can be shown on
                you rather than on a stranger. This is the only screen that
                asks, and nothing is captured until you say so here.
              </p>
            </Stack>

            <Stack gap={24}>
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1">
                {PROMISES.map((promise) => (
                  <div
                    key={promise.title}
                    className="border-t border-rule pt-4 lg:border-t-0 lg:border-s lg:pt-0 lg:ps-6"
                  >
                    <p className="text-body font-medium text-fg">{promise.title}</p>
                    <p className="max-w-measure text-body text-fg-muted">
                      {promise.body}
                    </p>
                  </div>
                ))}
              </div>

              {/* Capped at tablet portrait. A switch and the label it controls
                  cannot sit 350px apart across 704px of card and still read as
                  one control — the extra width is composition elsewhere, not
                  distance here. At lg: the two-column split already caps it. */}
              <Card className="md:mx-auto md:w-full md:max-w-action lg:mx-0 lg:max-w-none">
                <CardContent className="flex items-start justify-between gap-6 p-6 md:p-8">
                  <div className="min-w-0">
                    <p
                      id="capture-consent-label"
                      className="text-body font-medium text-fg"
                    >
                      Use my camera to take my two frames
                    </p>
                    <p className="max-w-measure text-body text-fg-muted">
                      The camera cannot open until this is on. Nothing else on
                      this screen turns it on for you.
                    </p>
                  </div>
                  <Switch
                    checked={agreed}
                    onCheckedChange={setAgreed}
                    aria-labelledby="capture-consent-label"
                  />
                </CardContent>
              </Card>

              {/* Voice is a second capture path and it gets a second ask. The
                  screen used to say the camera was "the only thing we ask
                  for" while tapping the shutter started SpeechRecognition —
                  which opens the microphone and sends audio away for
                  transcription. Saying so is the fix; the shutter works
                  perfectly well as a tap. */}
              <Card className="md:mx-auto md:w-full md:max-w-action lg:mx-0 lg:max-w-none">
                <CardContent className="flex items-start justify-between gap-6 p-6 md:p-8">
                  <div className="min-w-0">
                    <p
                      id="voice-consent-label"
                      className="text-body font-medium text-fg"
                    >
                      Let me say &ldquo;Snap&rdquo; instead of tapping
                    </p>
                    <p className="max-w-measure text-body text-fg-muted">
                      Your browser sends a moment of audio away to recognise the
                      word. Leave this off and the shutter is a tap — nothing
                      you say is listened to.
                    </p>
                  </div>
                  <Switch
                    checked={voiceAgreed}
                    onCheckedChange={setVoiceAgreed}
                    aria-labelledby="voice-consent-label"
                  />
                </CardContent>
              </Card>
            </Stack>
          </div>

          <ActionRow>
            <Button onClick={grantConsent} disabled={!agreed}>
              Open the studio
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </ActionRow>
        </Stack>
      </AppContainer>
    );
  }

  /* ---------------------------------------------------------------- capture */

  return (
    <AppContainer id="module-handsfree-capture" className="py-8 md:py-12">
      {/* Phone and tablet portrait stack; tablet landscape sets the viewfinder
          beside its guidance instead of under it. The frame is capped at the
          drawer measure at every size — a portrait viewfinder stretched to
          1024px is a phone layout wearing a tablet. */}
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
        <Stack gap={16} className="mx-auto w-full max-w-drawer lg:mx-0 lg:shrink-0">
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-card border border-rule bg-surface">
            {cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 size-full object-cover"
              />
            ) : sidePhoto || frontPhoto ? (
              <img
                src={sidePhoto || frontPhoto || ''}
                alt="Your most recent frame"
                className="absolute inset-0 size-full animate-reveal object-cover"
              />
            ) : null}

            {/* The still, held over the live preview for a beat: the Reveal is
                the moment the reader learns the capture happened. */}
            {heldFrame ? (
              <img
                src={heldFrame}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 size-full animate-reveal object-cover"
              />
            ) : null}

            {CORNER.map((corner) => (
              <span
                key={corner}
                aria-hidden="true"
                className={cn('absolute block size-6 border-fg/30', corner)}
              />
            ))}

            <div className="absolute inset-0 flex items-center justify-center">
              <Silhouette aligned={aligned} />
            </div>

            <div className="absolute inset-x-4 top-4 flex justify-center">
              <span
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-4 py-2',
                  'bg-surface/70 text-eyebrow font-medium uppercase backdrop-blur-md',
                  'transition-colors duration-resolve ease-resolve',
                  aligned ? 'border-fg text-fg' : 'border-rule text-fg-muted',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'block size-1.5 rounded-full',
                    aligned ? 'bg-fg' : 'bg-fg-muted',
                  )}
                />
                {aligned ? 'Level' : 'Not level yet'}
              </span>
            </div>

            {cameraBlocked ? (
              <p className="absolute inset-x-6 bottom-6 text-center text-body text-fg-muted">
                No camera here. Upload two frames instead.
              </p>
            ) : null}
          </div>

          {/* Which of the two frames are held. Sans, tabular where it counts. */}
          <ul className="grid grid-cols-2 gap-4">
            {[
              { label: 'Front', held: Boolean(frontPhoto) },
              { label: 'Side', held: Boolean(sidePhoto) },
            ].map((frame) => (
              <li
                key={frame.label}
                className={cn(
                  'flex items-center gap-2 border-t pt-3 text-eyebrow font-medium uppercase',
                  frame.held ? 'border-fg text-fg' : 'border-rule text-fg-muted',
                )}
              >
                {frame.held ? (
                  <Check className="size-4 shrink-0" aria-hidden="true" />
                ) : null}
                {frame.label}
                <span className="sr-only">
                  {frame.held ? ' frame held' : ' frame not yet taken'}
                </span>
              </li>
            ))}
          </ul>
        </Stack>

        {/* The surrounding space carries the instruments and the guidance. On
            tablet portrait those two sit side by side rather than growing. */}
        <Stack gap={24} className="min-w-0 flex-1 lg:max-w-drawer">
          {/* The one editorial line on the screen between two Displays. The
              studio is the theatrical heart of the flow and had no voice. */}
          <OccasionTitle>Two frames, and we take it from there.</OccasionTitle>

          <p role="status" className="max-w-measure text-body text-fg">
            {instruction}
          </p>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
            <Card>
              <CardContent className="p-6 md:p-8">
                <Stack gap={16}>
                  <span className="text-control font-medium uppercase text-fg-muted">
                    How the phone sits
                  </span>
                  <Gauge
                    label="Tilt"
                    value={pitch}
                    min={PITCH_MIN}
                    max={PITCH_MAX}
                  />
                  <Gauge
                    label="Lean"
                    value={roll}
                    min={-ROLL_RANGE}
                    max={ROLL_RANGE}
                  />
                  {!sensorLive || manualOverride ? (
                    <Stack gap={8}>
                      <label
                        htmlFor="capture-tilt"
                        className="text-body text-fg-muted"
                      >
                        {sensorLive
                          ? 'Set it by hand — the live reading is being ignored.'
                          : 'This device cannot feel how it is standing. Set it by hand.'}
                      </label>
                      <Slider
                        id="capture-tilt"
                        value={pitch}
                        min={PITCH_MIN}
                        max={PITCH_MAX}
                        step={0.5}
                        onValueChange={setPitch}
                      />
                    </Stack>
                  ) : overrideAvailable ? (
                    <button
                      type="button"
                      onClick={() => setManualOverride(true)}
                      className="text-left text-body text-fg-muted underline decoration-rule underline-offset-4 hoverable:hover:text-fg"
                    >
                      Still not settling? Set the tilt by hand instead.
                    </button>
                  ) : null}
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 md:p-8">
                <Stack gap={16}>
                  <div className="flex items-baseline justify-between gap-4">
                    <label
                      htmlFor="capture-height"
                      className="text-control font-medium uppercase text-fg-muted"
                    >
                      Your height
                    </label>
                    <span className="text-price tabular text-fg">{heightCm} cm</span>
                  </div>
                  <Slider
                    id="capture-height"
                    value={heightCm}
                    min={150}
                    max={195}
                    onValueChange={setHeightCm}
                  />
                  <p className="max-w-measure text-body text-fg-muted">
                    Height is the ruler every measurement is scaled from. Get
                    this one right and the rest follow.
                  </p>
                </Stack>
              </CardContent>
            </Card>
          </div>

          {/* The signature moment: one round shutter, carrying the mark, that
              answers to a word. The caption carries the reason the shutter is
              unavailable — a disabled control is dropped from the
              accessibility tree in several browsers, so the reason has to live
              somewhere that is not the button. */}
          {step === 'ready' ? null : (
            <div className="flex flex-col items-center gap-4">
              <button
                type="button"
                onClick={listen}
                disabled={!aligned || !cameraActive || Boolean(heldFrame)}
                aria-label={`Capture your ${step} frame${voiceAgreed ? ' — say Snap or tap' : ''}`}
                className={cn(
                  'relative inline-flex size-20 items-center justify-center rounded-full',
                  'border border-rule bg-surface text-fg',
                  'transition-colors duration-shift ease-shift',
                  'disabled:pointer-events-none disabled:opacity-40',
                  'motion-safe:active:scale-[0.98]',
                  'hoverable:hover:border-fg',
                )}
              >
                {listening ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full border border-fg motion-safe:animate-breath"
                  />
                ) : null}
                <YMark className="h-7" />
              </button>
              <span className="text-eyebrow font-medium uppercase text-fg-muted">
                {listening
                  ? 'Listening'
                  : heldFrame
                    ? 'Frame held'
                    : !cameraActive
                      ? 'Upload your frames instead'
                      : !aligned
                        ? 'Level the phone first'
                        : voiceAgreed
                          ? 'Say “Snap” or tap'
                          : 'Tap to capture'}
              </span>
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />

          <ActionRow>
            {step === 'ready' ? (
              <>
                <Button variant="secondary" onClick={retake}>
                  Retake
                </Button>
                <Button onClick={finish}>
                  Read my fit
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              </>
            ) : (
              <Button variant="secondary" onClick={() => fileRef.current?.click()}>
                <Upload className="size-4" aria-hidden="true" />
                Upload this frame
              </Button>
            )}
          </ActionRow>
        </Stack>
      </div>
    </AppContainer>
  );
};
