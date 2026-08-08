import { useEffect, useState } from 'react';
import { HeaderNav } from './components/HeaderNav';
import { HandsFreeCapture } from './components/HandsFreeCapture';
import { SizingEngine } from './components/SizingEngine';
import { StyleGuardrails } from './components/StyleGuardrails';
import { SwipeDiscovery } from './components/SwipeDiscovery';
import { CapsuleWardrobe } from './components/CapsuleWardrobe';
import { CheckoutModal } from './components/CheckoutModal';
import { ResponsiveSheet } from './components/ui';
import { AppPhase, CapturedProfile, UserMeasurements, BrandSizeMapping, StyleConstraints, FashionLook } from './types';
import {
  COMPOSED_LOOK_TEMPLATE,
  INITIAL_LOOKS,
  LOOK_PLACEHOLDER,
} from './data/sampleLooks';
import { calculatePhotogrammetryMeasurements, mapMeasurementsToBrandSizes } from './data/brandGrading';

/**
 * Dark is theatre; cream is conversation. The app presents during capture,
 * the fit reveal and discovery; the user works in guardrails and the capsule.
 */
const GROUND: Record<AppPhase, 'onyx' | 'cream'> = {
  onboarding: 'onyx',
  sizing: 'onyx',
  guardrails: 'cream',
  discovery: 'onyx',
  capsule: 'cream',
};

const APP_PHASES: AppPhase[] = ['onboarding', 'sizing', 'guardrails', 'discovery', 'capsule'];

// A customer never sees this — the entry point is always the studio, below.
// It exists so the responsive-capture harness (scripts/capture.mjs) can load
// any screen directly instead of clicking through the whole journey for each
// one: ?phase=discovery.
function phaseFromQueryString(): AppPhase | null {
  const requested = new URLSearchParams(window.location.search).get('phase');
  return APP_PHASES.includes(requested as AppPhase) ? (requested as AppPhase) : null;
}

export default function App() {
  // App Phase State
  // The product opens where it begins. Capture is the first thing YGS asks
  // for and everything after it depends on the answer, so the entry point is
  // the studio — not a working screen reached with the middle skipped.
  const [currentPhase, setCurrentPhase] = useState<AppPhase>(
    () => phaseFromQueryString() ?? 'onboarding'
  );
  const [heightCm, setHeightCm] = useState<number>(170);

  // User Photogrammetry & Sizing State
  // Nothing has been captured yet, and the app does not pretend otherwise —
  // a stock photograph of a stranger standing in for the user's own body scan
  // is not a placeholder, it is a lie with a face on it.
  const [capturedProfile, setCapturedProfile] = useState<CapturedProfile>({
    frontPhoto: null,
    sidePhoto: null,
    heightCm: 170,
    timestamp: Date.now(),
    isSensorVerified: false,
    isVoiceTriggered: false,
  });

  const [measurements, setMeasurements] = useState<UserMeasurements>(
    calculatePhotogrammetryMeasurements(170)
  );

  const [brandSizes, setBrandSizes] = useState<BrandSizeMapping[]>(
    mapMeasurementsToBrandSizes(measurements)
  );

  // Style Guardrails State ("Style Like You")
  const [constraints, setConstraints] = useState<StyleConstraints>({
    modestWear: true,
    sleevesBelowElbow: true,
    noTrousers: false,
    hemlineBelowKnee: true,
    noNeonColors: true,
    noLoudPrints: true,
    preferredFabrics: ['Mulberry Silk', 'Baby Cashmere', 'Virgin Wool', 'Raw Linen'],
  });

  // Looks & Capsule State
  const [looksList, setLooksList] = useState<FashionLook[]>(INITIAL_LOOKS);
  const [savedLooks, setSavedLooks] = useState<FashionLook[]>([INITIAL_LOOKS[0]]);
  const [checkoutLook, setCheckoutLook] = useState<FashionLook | null>(null);

  // Style Intelligence State
  const [isFinding, setIsFinding] = useState<boolean>(false);
  // Nothing on screen spins to fake motion — but three seconds of silence
  // reads as broken, so the copy itself changes instead.
  const [isFindingSlow, setIsFindingSlow] = useState<boolean>(false);
  // A failed search is not a look — it never enters looksList — so it is
  // held as its own state and shown honestly instead of being logged and
  // dropped.
  const [findError, setFindError] = useState<string | null>(null);
  const [showGuardrailsModal, setShowGuardrailsModal] = useState<boolean>(false);

  const ground = GROUND[currentPhase];

  // The ground belongs to the document, not just to a div — otherwise an
  // overscroll bounce or a notch shows the wrong colour behind the app.
  useEffect(() => {
    document.body.dataset.ground = ground;
  }, [ground]);

  // Handlers
  const handleCaptureComplete = (profile: CapturedProfile) => {
    setCapturedProfile(profile);
    const newMeas = calculatePhotogrammetryMeasurements(profile.heightCm);
    setMeasurements(newMeas);
    setBrandSizes(mapMeasurementsToBrandSizes(newMeas));
    setCurrentPhase('sizing');
  };

  const handleProceedToGuardrails = (meas: UserMeasurements, bSizes: BrandSizeMapping[]) => {
    setMeasurements(meas);
    setBrandSizes(bSizes);
    setCurrentPhase('guardrails');
  };

  const handleSwipeRight = (look: FashionLook) => {
    if (!savedLooks.some((item) => item.id === look.id)) {
      setSavedLooks((prev) => [look, ...prev]);
    }
  };

  const handleSwipeLeft = (look: FashionLook) => {
    // Rejection recorded for preference weight tuning
  };

  const handleRemoveSavedLook = (lookId: string) => {
    setSavedLooks((prev) => prev.filter((item) => item.id !== lookId));
  };

  // The machinery has no name in the UI and no name here either.
  const handleFindLook = async (occasion: string) => {
    setIsFinding(true);
    setIsFindingSlow(false);
    setFindError(null);

    // The slow path is not a spinner, it is different words — so it needs
    // its own clock, started here and always cleared below.
    const slowTimer = setTimeout(() => setIsFindingSlow(true), 3000);

    try {
      const res = await fetch('/api/style-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          occasion: occasion === 'All Occasions' ? 'Networking Dinner' : occasion,
          heightCm,
          constraints,
        }),
      });

      if (!res.ok) {
        throw new Error(`style-recommendations responded ${res.status}`);
      }

      const data = await res.json();

      if (!data.look_title) {
        throw new Error('style-recommendations returned no look');
      }

      // Now attempt try-on image generation. Its own failure never fails the
      // whole search — a look with an honest placeholder plate is still a
      // look — but it must not be allowed to pass a stock photo off as a
      // render of it, so only a call that reports success is trusted, and a
      // failure here is stated on the card itself rather than hidden behind
      // the placeholder (YGS-27).
      let generatedImageUrl = LOOK_PLACEHOLDER;
      let imageGenerationFailed = false;
      try {
        const tryonRes = await fetch('/api/generate-tryon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: `${data.look_title}: ${data.top_garment} with ${data.bottom_garment}. Modest elegant GCC high fashion.`,
            userPhotoBase64: capturedProfile.frontPhoto,
          }),
        });
        const tryonData = await tryonRes.json();
        if (tryonRes.ok && tryonData.success && tryonData.imageUrl) {
          generatedImageUrl = tryonData.imageUrl;
        } else {
          imageGenerationFailed = true;
        }
      } catch (e) {
        imageGenerationFailed = true;
        console.warn('Tryon image generation failed:', e);
      }

      const foundLook: FashionLook = {
        ...COMPOSED_LOOK_TEMPLATE,
        id: `look-${Date.now()}`,
        look_title: data.look_title,
        occasion: data.occasion || occasion,
        top_garment: data.top_garment,
        bottom_garment: data.bottom_garment,
        // Fail CLOSED. Modest wear and the other Style Like You rules are hard
        // guardrails, not preferences — a look whose compliance the model did
        // not assert is unverified, and unverified must never render as
        // "Guardrail Verified". Defaulting to true asserts a cultural
        // constraint was honoured on no evidence at all.
        compliance_check: data.compliance_check === true,
        capsule_synergy: data.capsule_synergy || 'Pairs seamlessly with your existing luxury capsule wardrobe.',
        imageUrl: generatedImageUrl,
        imageGenerationFailed,
        brand_sizes: brandSizes,
      };

      setLooksList((prev) => [foundLook, ...prev]);
    } catch (err) {
      console.error('Failed to find a look:', err);
      // What happened, what to do — nothing the model or the network said.
      setFindError("Nothing came back — the connection may have dropped.");
    } finally {
      clearTimeout(slowTimer);
      setIsFinding(false);
      setIsFindingSlow(false);
    }
  };

  return (
    <div
      id="app-root-container"
      data-ground={ground}
      className="flex min-h-dvh flex-col"
    >
      <HeaderNav
        currentPhase={currentPhase}
        setPhase={setCurrentPhase}
        savedCount={savedLooks.length}
        constraints={constraints}
        onOpenGuardrails={() => setShowGuardrailsModal(true)}
        heightCm={heightCm}
        onFindLook={handleFindLook}
        isFinding={isFinding}
      />

      {/* Screens own their own gutters (each mounts an AppContainer), so main
          adds none — but it does cap and centre them, so extra tablet width
          becomes margin instead of a phone layout stretched to 1180px. */}
      <main className="safe-bottom mx-auto flex min-h-0 w-full max-w-app flex-1 flex-col">
        {currentPhase === 'onboarding' && (
          <HandsFreeCapture
            onCaptureComplete={handleCaptureComplete}
            heightCm={heightCm}
            setHeightCm={setHeightCm}
          />
        )}

        {currentPhase === 'sizing' && (
          <SizingEngine
            capturedProfile={capturedProfile}
            onProceedToGuardrails={handleProceedToGuardrails}
          />
        )}

        {currentPhase === 'guardrails' && (
          <StyleGuardrails
            constraints={constraints}
            setConstraints={setConstraints}
            onSaveAndProceed={() => setCurrentPhase('discovery')}
          />
        )}

        {currentPhase === 'discovery' && (
          <SwipeDiscovery
            looks={looksList}
            constraints={constraints}
            capturedProfile={capturedProfile}
            brandSizes={brandSizes}
            onSwipeRight={handleSwipeRight}
            onSwipeLeft={handleSwipeLeft}
            onBuyLook={(look) => setCheckoutLook(look)}
            onFindLook={handleFindLook}
            isFinding={isFinding}
            isFindingSlow={isFindingSlow}
            findError={findError}
          />
        )}

        {currentPhase === 'capsule' && (
          <CapsuleWardrobe
            savedLooks={savedLooks}
            onRemoveLook={handleRemoveSavedLook}
            onBuyLook={(look) => setCheckoutLook(look)}
            onContinueShopping={() => setCurrentPhase('discovery')}
          />
        )}
      </main>

      {/* Guardrails opened from the menu — a sheet on phone, a dialog on tablet. */}
      <ResponsiveSheet
        open={showGuardrailsModal}
        onOpenChange={setShowGuardrailsModal}
        ground="cream"
        title="Style guardrails"
        description="What you will and will not wear. Every look respects these."
      >
        <StyleGuardrails
          constraints={constraints}
          setConstraints={setConstraints}
          onSaveAndProceed={() => setShowGuardrailsModal(false)}
        />
      </ResponsiveSheet>

      {/* Atomic Checkout Modal */}
      <CheckoutModal
        look={checkoutLook}
        brandSizes={brandSizes}
        onClose={() => setCheckoutLook(null)}
      />
    </div>
  );
}
