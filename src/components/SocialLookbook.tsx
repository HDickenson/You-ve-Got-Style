import React, { useState } from 'react';
import { FashionLook } from '../types';
import { Camera, ChevronLeft, ChevronRight, Share, Download } from 'lucide-react';

interface SocialLookbookProps {
  savedLooks: FashionLook[];
}

export const SocialLookbook: React.FC<SocialLookbookProps> = ({ savedLooks }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (savedLooks.length === 0) {
    return (
      <div className="max-w-md mx-auto p-4 flex flex-col items-center justify-center h-[80vh] text-center">
        <Camera className="w-12 h-12 text-stone-600 mb-4" />
        <h2 className="font-serif text-xl font-bold text-amber-100 mb-2">Your Lookbook is Empty</h2>
        <p className="text-sm text-stone-400">Save some looks in the Discovery phase to curate your social lookbook.</p>
      </div>
    );
  }

  const look = savedLooks[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % savedLooks.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + savedLooks.length) % savedLooks.length);
  };

  return (
    <div className="max-w-md mx-auto p-4 h-[85vh] flex flex-col items-center animate-fade-in-up">
      <div className="w-full flex items-center justify-between mb-4 px-2">
        <h2 className="font-serif text-xl font-bold text-amber-100 flex items-center gap-2">
          <Camera className="w-5 h-5 text-amber-400" />
          Social Lookbook
        </h2>
        <span className="text-xs font-mono text-stone-400">
          {currentIndex + 1} / {savedLooks.length}
        </span>
      </div>

      {/* 9:16 Aspect Ratio Container for Stories */}
      <div className="relative w-full max-w-[320px] aspect-[9/16] bg-stone-900 rounded-3xl overflow-hidden shadow-2xl border border-stone-800">
        <img 
          src={look.imageUrl} 
          alt={look.look_title} 
          className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-overlay"
        />
        
        {/* Story Overlay UI */}
        <div className="absolute inset-0 flex flex-col justify-between p-6 bg-gradient-to-t from-stone-950 via-stone-950/20 to-stone-950/60 pointer-events-none">
          {/* Header */}
          <div className="flex justify-between items-start mt-2">
            <div className="flex flex-col">
              <span className="text-xs font-mono text-amber-400 uppercase tracking-widest bg-stone-950/80 px-2 py-1 rounded backdrop-blur-md self-start border border-amber-500/30">
                {look.brand}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full border border-stone-600 bg-stone-800 flex items-center justify-center backdrop-blur-md">
              <Camera className="w-4 h-4 text-stone-300" />
            </div>
          </div>

          {/* Footer Details */}
          <div className="space-y-4 mb-4">
            <div>
              <h3 className="font-serif text-2xl font-bold text-stone-50 leading-tight mb-1 drop-shadow-md">
                {look.look_title}
              </h3>
              <p className="text-sm font-mono text-stone-300 drop-shadow-md">
                OUTFIT OF THE DAY
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="bg-stone-950/60 backdrop-blur-md rounded-lg p-2.5 border border-stone-700/50">
                <span className="text-[10px] text-stone-400 uppercase tracking-wider block mb-0.5">Top</span>
                <span className="text-xs text-stone-100 font-medium">{look.top_garment}</span>
              </div>
              <div className="bg-stone-950/60 backdrop-blur-md rounded-lg p-2.5 border border-stone-700/50">
                <span className="text-[10px] text-stone-400 uppercase tracking-wider block mb-0.5">Bottom</span>
                <span className="text-xs text-stone-100 font-medium">{look.bottom_garment}</span>
              </div>
              {look.dress_garment && (
                <div className="bg-stone-950/60 backdrop-blur-md rounded-lg p-2.5 border border-stone-700/50">
                  <span className="text-[10px] text-stone-400 uppercase tracking-wider block mb-0.5">Dress</span>
                  <span className="text-xs text-stone-100 font-medium">{look.dress_garment}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        <button 
          onClick={handlePrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-stone-950/50 text-stone-300 hover:text-white backdrop-blur-sm transition-colors border border-stone-700"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button 
          onClick={handleNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-stone-950/50 text-stone-300 hover:text-white backdrop-blur-sm transition-colors border border-stone-700"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-6 w-full max-w-[320px]">
        <button className="flex-1 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold flex items-center justify-center gap-2 transition-colors border border-stone-700">
          <Download className="w-4 h-4" />
          <span className="text-sm">Save</span>
        </button>
        <button className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold flex items-center justify-center gap-2 transition-colors">
          <Share className="w-4 h-4" />
          <span className="text-sm">Share Story</span>
        </button>
      </div>
    </div>
  );
};
