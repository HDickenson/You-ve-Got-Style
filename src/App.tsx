import React, { useState } from 'react';
import { HeaderNav } from './components/HeaderNav';
import { HandsFreeCapture } from './components/HandsFreeCapture';
import { SizingEngine } from './components/SizingEngine';
import { StyleGuardrails } from './components/StyleGuardrails';
import { SwipeDiscovery } from './components/SwipeDiscovery';
import { CapsuleWardrobe } from './components/CapsuleWardrobe';
import { CheckoutModal } from './components/CheckoutModal';
import { AppPhase, CapturedProfile, UserMeasurements, BrandSizeMapping, StyleConstraints, FashionLook } from './types';
import { INITIAL_LOOKS } from './data/sampleLooks';
import { calculatePhotogrammetryMeasurements, mapMeasurementsToBrandSizes } from './data/brandGrading';

export default function App() {
  // App Phase State
  const [currentPhase, setCurrentPhase] = useState<AppPhase>('discovery'); // Default to instant working discovery UI!
  const [heightCm, setHeightCm] = useState<number>(170);

  // User Photogrammetry & Sizing State
  const [capturedProfile, setCapturedProfile] = useState<CapturedProfile>({
    frontPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    sidePhoto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
    heightCm: 170,
    timestamp: Date.now(),
    isSensorVerified: true,
    isVoiceTriggered: true,
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

  // AI Loading State
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [showGuardrailsModal, setShowGuardrailsModal] = useState<boolean>(false);

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

  const handleGenerateAiLook = async (occasion: string) => {
    setIsGeneratingAi(true);
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

      const data = await res.json();

      if (data.look_title) {
        // Now attempt try-on image generation
        let generatedImageUrl = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80';
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
          if (tryonData.imageUrl) {
            generatedImageUrl = tryonData.imageUrl;
          }
        } catch (e) {
          console.warn('Tryon image API fallback used:', e);
        }

        const newAiLook: FashionLook = {
          id: `ai-look-${Date.now()}`,
          look_title: data.look_title,
          occasion: data.occasion || occasion,
          top_garment: data.top_garment,
          bottom_garment: data.bottom_garment,
          compliance_check: data.compliance_check ?? true,
          capsule_synergy: data.capsule_synergy || 'Pairs seamlessly with your existing luxury capsule wardrobe.',
          brand: 'Gemini Haute Couture',
          priceUSD: 2300,
          priceAED: 8440,
          fabric: 'Mulberry Silk & Italian Cashmere',
          colorPalette: ['#E2C044', '#1A2B4C', '#F7F5F0'],
          imageUrl: generatedImageUrl,
          tags: ['AI Generated', 'Modest Wear', 'Custom Fitting'],
          brand_sizes: brandSizes,
        };

        setLooksList((prev) => [newAiLook, ...prev]);
      }
    } catch (err) {
      console.error('Failed to generate AI look:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div id="app-root-container" className="min-h-screen bg-stone-950 text-stone-100 font-sans antialiased selection:bg-amber-500 selection:text-stone-950 flex flex-col justify-between">
      {/* Top Header Navigation */}
      <HeaderNav
        currentPhase={currentPhase}
        setPhase={setCurrentPhase}
        savedCount={savedLooks.length}
        constraints={constraints}
        onOpenGuardrails={() => setShowGuardrailsModal(true)}
        heightCm={heightCm}
        onGenerateAiLook={handleGenerateAiLook}
        isGeneratingAi={isGeneratingAi}
      />

      {/* Main Phase View Controller */}
      <main className="flex-1 pb-4">
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
            onGenerateAiLook={handleGenerateAiLook}
            isGeneratingAi={isGeneratingAi}
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

      {/* Guardrails Settings Modal overlay if requested from header */}
      {showGuardrailsModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-3">
          <div className="bg-stone-900 border border-stone-800 text-stone-100 w-full max-w-md rounded-2xl p-4 max-h-[85vh] overflow-y-auto shadow-2xl">
            <StyleGuardrails
              constraints={constraints}
              setConstraints={setConstraints}
              onSaveAndProceed={() => setShowGuardrailsModal(false)}
            />
          </div>
        </div>
      )}

      {/* Atomic Checkout Modal */}
      <CheckoutModal
        look={checkoutLook}
        brandSizes={brandSizes}
        onClose={() => setCheckoutLook(null)}
      />
    </div>
  );
}
