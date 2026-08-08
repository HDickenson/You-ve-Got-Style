import React, { useState, useRef } from 'react';
import { Heart, X, ShoppingCart, ShieldCheck, Sparkles, Check, ChevronDown, Layers, Share, Upload } from 'lucide-react';
import { FashionLook, StyleConstraints, BrandSizeMapping, CapturedProfile } from '../types';

interface SwipeDiscoveryProps {
  looks: FashionLook[];
  constraints: StyleConstraints;
  capturedProfile: CapturedProfile;
  brandSizes: BrandSizeMapping[];
  onSwipeRight: (look: FashionLook) => void;
  onSwipeLeft: (look: FashionLook) => void;
  onBuyLook: (look: FashionLook) => void;
  onGenerateAiLook: (occasion: string) => Promise<void>;
  isGeneratingAi: boolean;
  onUploadLook?: (look: FashionLook) => void;
}

const OCCASIONS = [
  'All Occasions',
  'Business Casual',
  'Board Meeting',
  'Networking Dinner',
  'Weekend Brunch',
  'Art Gallery Opening',
  'Galas & Events',
  'Gala Night',
  'Beach Wedding'
];

export const SwipeDiscovery: React.FC<SwipeDiscoveryProps> = ({
  looks,
  constraints,
  capturedProfile,
  brandSizes,
  onSwipeRight,
  onSwipeLeft,
  onBuyLook,
  onGenerateAiLook,
  isGeneratingAi,
  onUploadLook
}) => {
  const [selectedOccasion, setSelectedOccasion] = useState<string>('All Occasions');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [useFaceOverlay, setUseFaceOverlay] = useState<boolean>(true);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Style Synergy System Filter
  const [applySynergyFilter, setApplySynergyFilter] = useState<boolean>(true);

  // Filter looks based on selected occasion and strict constraints
  const filteredLooks = looks.filter((look) => {
    if (selectedOccasion !== 'All Occasions' && look.occasion !== selectedOccasion) {
      return false;
    }
    
    if (applySynergyFilter) {
      // Style Synergy / Guardrail filter check
      if (constraints.noTrousers && look.bottom_garment.toLowerCase().includes('trouser')) return false;
      if (constraints.noNeonColors && look.colorPalette.some(c => ['#00FF00', '#FF00FF', '#FFFF00'].includes(c))) return false;
    }
    
    return true;
  });

  const activeLook = filteredLooks.length > 0 ? filteredLooks[currentIndex % filteredLooks.length] : looks[0];

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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: activeLook.look_title,
          text: `Check out this look: ${activeLook.look_title} by ${activeLook.brand}!`,
          url: window.location.href,
        });
        showToast('Shared successfully!');
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      showToast('Sharing not supported on this device');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      
      try {
        const res = await fetch('/api/auto-tag-look', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64 })
        });
        
        const data = await res.json();
        if (data.occasion && onUploadLook) {
          const newLook: FashionLook = {
            id: `custom-look-${Date.now()}`,
            look_title: data.look_title || 'Custom Uploaded Look',
            occasion: data.occasion,
            top_garment: data.top_garment || 'Unknown Top',
            bottom_garment: data.bottom_garment || 'Unknown Bottom',
            compliance_check: true,
            capsule_synergy: data.capsule_synergy || 'High synergy with your capsule.',
            brand: 'Custom Upload',
            priceUSD: 0,
            priceAED: 0,
            fabric: 'Mixed',
            colorPalette: [],
            imageUrl: base64, // using local base64 for preview
            tags: ['Custom'],
            brand_sizes: brandSizes
          };
          onUploadLook(newLook);
          setSelectedOccasion(data.occasion); // switch to that occasion to see it!
          showToast(`Tagged as ${data.occasion}`);
        }
      } catch (err) {
        console.error('Failed to auto-tag look', err);
        showToast('Failed to analyze image');
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div id="module-swipe-discovery" className="min-h-[85vh] bg-stone-950 text-stone-100 max-w-md mx-auto flex flex-col justify-between relative p-3">
      
      {/* Top Controls Area */}
      <div className="flex flex-col gap-2 mb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="relative flex-1">
            <select
              value={selectedOccasion}
              onChange={(e) => setSelectedOccasion(e.target.value)}
              className="w-full appearance-none bg-stone-900 border border-stone-800 text-stone-200 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-amber-500/50"
            >
              {OCCASIONS.map((occ) => (
                <option key={occ} value={occ}>{occ}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 pointer-events-none" />
          </div>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-stone-900 border border-stone-800 text-amber-400 p-2 rounded-xl hover:bg-stone-800 transition-colors flex items-center justify-center disabled:opacity-50"
            title="Upload Custom Look for Auto-Tagging"
          >
            <Upload className="w-4 h-4" />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
        
        <label className="flex items-center gap-2 text-xs text-stone-400 cursor-pointer">
          <input 
            type="checkbox" 
            checked={applySynergyFilter} 
            onChange={(e) => setApplySynergyFilter(e.target.checked)} 
            className="rounded bg-stone-900 border-stone-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-stone-950"
          />
          Apply Style Synergy System (Match my tastes)
        </label>
      </div>

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
          <div className="absolute right-4 top-0 z-30">
            <button
              onClick={handleShare}
              className="p-2.5 rounded-full bg-stone-950/80 border border-stone-700 text-stone-300 hover:text-amber-400 hover:border-amber-400/50 backdrop-blur-md shadow-xl transition-all"
              title="Share this look"
            >
              <Share className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-mono font-bold text-amber-400 tracking-wider uppercase bg-stone-950/80 px-2 py-0.5 rounded border border-amber-500/30">
              {activeLook.brand}
            </span>
            <div className="text-right">
              <span className="text-lg font-serif font-bold text-stone-100 block leading-none pr-10">
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

