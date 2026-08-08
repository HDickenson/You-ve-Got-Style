import React, { useState } from 'react';
import { Heart, X, ShoppingCart, ShieldCheck, Sparkles, Check, ChevronDown, Layers } from 'lucide-react';
import { FashionLook, StyleConstraints, BrandSizeMapping, CapturedProfile } from '../types';

interface SwipeDiscoveryProps {
  looks: FashionLook[];
  constraints: StyleConstraints;
  capturedProfile: CapturedProfile;
  brandSizes: BrandSizeMapping[];
  onSwipeRight: (look: FashionLook) => void;
  onSwipeLeft: (look: FashionLook) => void;
  onBuyLook: (look: FashionLook) => void;
  onFindLook: (occasion: string) => Promise<void>;
  isFinding: boolean;
}

const OCCASIONS = [
  'All Occasions',
  'Board Meeting',
  'Networking Dinner',
  'Weekend Brunch',
  'Art Gallery Opening',
  'Galas & Events',
];

export const SwipeDiscovery: React.FC<SwipeDiscoveryProps> = ({
  looks,
  constraints,
  capturedProfile,
  brandSizes,
  onSwipeRight,
  onSwipeLeft,
  onBuyLook,
  onFindLook,
  isFinding,
}) => {
  const [selectedOccasion, setSelectedOccasion] = useState<string>('All Occasions');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [useFaceOverlay, setUseFaceOverlay] = useState<boolean>(true);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Filter looks based on selected occasion and strict constraints
  const filteredLooks = looks.filter((look) => {
    if (selectedOccasion !== 'All Occasions' && look.occasion !== selectedOccasion) {
      return false;
    }
    // Hard guardrail filter check
    if (constraints.noTrousers && look.bottom_garment.toLowerCase().includes('trouser')) {
      return false;
    }
    return true;
  });

  const activeLook = filteredLooks[currentIndex % Math.max(filteredLooks.length, 1)] || looks[0];

  const handleNext = (action: 'like' | 'dislike') => {
    if (action === 'like') {
      onSwipeRight(activeLook);
      showToast('Saved to Capsule Wardrobe');
    } else {
      onSwipeLeft(action === 'dislike' ? activeLook : activeLook);
      showToast('Preference Noted');
    }
    setCurrentIndex((prev) => prev + 1);
  };

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 2000);
  };

  return (
    <div id="module-swipe-discovery" className="min-h-[85vh] bg-stone-950 text-stone-100 max-w-md mx-auto flex flex-col justify-between relative p-3">
      {/* Sophisticated Hero Canvas - Occupies 85% Viewport */}
      <div className="relative flex-1 rounded-2xl overflow-hidden border border-stone-800/80 bg-stone-900 shadow-2xl flex flex-col justify-between mb-3 min-h-[500px]">
        {/* Main Outfit Image */}
        <div className="absolute inset-0 bg-stone-950 z-0">
          <img
            src={activeLook.imageUrl}
            alt={activeLook.look_title}
            className="w-full h-full object-cover object-center transition-all duration-700"
            referrerPolicy="no-referrer"
          />

          {/* User Face Twin Overlay */}
          {useFaceOverlay && capturedProfile.frontPhoto && (
            <div className="absolute top-[8%] left-[38%] w-[24%] aspect-square rounded-full overflow-hidden border-2 border-amber-400/90 shadow-2xl z-10 pointer-events-none opacity-90 backdrop-blur-[1px]">
              <img
                src={capturedProfile.frontPhoto}
                alt="Digital twin"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          {/* Dark Studio Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent z-10 pointer-events-none" />
        </div>

        {/* Card Top Overlay - Static Badges Only (Zero Buttons) */}
        <div className="relative z-20 p-3.5 flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono shadow-md backdrop-blur-md">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Guardrail Verified</span>
          </div>

          <span className="text-[10px] font-mono text-amber-300 bg-stone-950/80 px-2.5 py-1 rounded-full border border-stone-800 backdrop-blur-md">
            {activeLook.occasion}
          </span>
        </div>

        {/* Feedback Toast */}
        {feedbackToast && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-amber-400 text-stone-950 font-bold px-4 py-1.5 rounded-full text-xs shadow-2xl animate-bounce flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            <span>{feedbackToast}</span>
          </div>
        )}

        {/* Card Details Overlay */}
        <div className="relative z-20 p-4 pt-10">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-mono font-bold text-amber-400 tracking-wider uppercase bg-stone-950/80 px-2 py-0.5 rounded border border-amber-500/30">
              {activeLook.brand}
            </span>
            <div className="text-right">
              <span className="text-lg font-serif font-bold text-stone-100 block leading-none">
                AED {activeLook.priceAED.toLocaleString()}
              </span>
            </div>
          </div>

          <h3 className="text-xl font-serif font-bold text-white mb-1 drop-shadow">
            {activeLook.look_title}
          </h3>

          <p className="text-xs text-stone-300 font-sans line-clamp-2 mb-2">
            <strong>Top:</strong> {activeLook.top_garment}
            <br />
            <strong>Bottom:</strong> {activeLook.bottom_garment}
          </p>

          <div className="flex flex-wrap gap-1 mb-2">
            {activeLook.brand_sizes?.slice(0, 3).map((bs, i) => (
              <span key={i} className="text-[10px] bg-stone-950/90 text-stone-300 px-2 py-0.5 rounded border border-stone-800 font-mono">
                {bs.brandName}: <strong>{bs.recommendedSize}</strong>
              </span>
            ))}
          </div>

          <div className="bg-stone-950/85 border border-stone-800 p-2 rounded-xl text-[11px] text-stone-300 flex items-center gap-1.5 backdrop-blur-md">
            <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate"><strong>Synergy:</strong> {activeLook.capsule_synergy}</span>
          </div>
        </div>
      </div>

      {/* Thumb Zone Action Area: STRICTLY 2 BUTTONS (Making 3 buttons total on screen with Menu) */}
      <div id="thumb-zone-controls" className="grid grid-cols-2 gap-3 bg-stone-900/90 p-2.5 rounded-2xl border border-stone-800 shadow-2xl backdrop-blur-md">
        {/* Button 2: Not Like Me (Pass) */}
        <button
          id="btn-not-like-me"
          onClick={() => handleNext('dislike')}
          className="py-3.5 px-3 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-300 flex items-center justify-center gap-2 transition-all active:scale-95 group"
          title="Not like me (Pass)"
        >
          <div className="w-7 h-7 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
            <X className="w-4 h-4" />
          </div>
          <span className="text-xs font-mono font-bold tracking-wider uppercase text-stone-300">Pass</span>
        </button>

        {/* Button 3: Buy & Save Look */}
        <button
          id="btn-buy-the-look"
          onClick={() => {
            onSwipeRight(activeLook);
            onBuyLook(activeLook);
          }}
          className="py-3.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl group"
          title="Save to Capsule & Buy Look"
        >
          <div className="w-7 h-7 rounded-full bg-stone-950 text-amber-400 flex items-center justify-center shadow">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <span className="text-xs font-serif font-black tracking-wider uppercase">Buy Look</span>
        </button>
      </div>
    </div>
  );
};

