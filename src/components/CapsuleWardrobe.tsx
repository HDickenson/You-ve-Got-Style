import React from 'react';
import { Layers, ShoppingBag, ArrowRight, Trash2, ShieldCheck, Sparkles, ShoppingCart } from 'lucide-react';
import { FashionLook } from '../types';

interface CapsuleWardrobeProps {
  savedLooks: FashionLook[];
  onRemoveLook: (lookId: string) => void;
  onBuyLook: (look: FashionLook) => void;
  onContinueShopping: () => void;
}

export const CapsuleWardrobe: React.FC<CapsuleWardrobeProps> = ({
  savedLooks,
  onRemoveLook,
  onBuyLook,
  onContinueShopping,
}) => {
  const totalAED = savedLooks.reduce((sum, item) => sum + item.priceAED, 0);

  return (
    <div id="module-capsule-wardrobe" className="min-h-[85vh] bg-stone-950 text-stone-100 p-4 max-w-md mx-auto flex flex-col justify-between">
      {/* Header Banner */}
      <div>
        <div className="text-center mb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-medium mb-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Mix-&-Match Wardrobe Capsule</span>
          </div>
          <h2 className="text-xl font-serif font-bold text-amber-100">Your Personal Capsule Collection</h2>
          <p className="text-xs text-stone-400">Curated tailored pieces that effortlessly pair with each other.</p>
        </div>

        {/* Total Capsule Value Banner */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-3.5 mb-4 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono text-stone-400 block">Capsule Total ({savedLooks.length} looks):</span>
            <span className="text-xl font-serif font-bold text-amber-300">AED {totalAED.toLocaleString()}</span>
          </div>
          <button
            id="btn-continue-discovery"
            onClick={onContinueShopping}
            className="px-3 py-1.5 rounded-full bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs font-semibold border border-stone-700"
          >
            + Add More Looks
          </button>
        </div>

        {/* Capsule Items List */}
        {savedLooks.length === 0 ? (
          <div className="text-center py-12 bg-stone-900/40 rounded-2xl border border-dashed border-stone-800 p-6">
            <ShoppingBag className="w-10 h-10 text-stone-600 mx-auto mb-2" />
            <h3 className="text-sm font-serif font-bold text-stone-300 mb-1">No Looks Saved Yet</h3>
            <p className="text-xs text-stone-400 mb-4">Swipe right ("This is me") on looks in Discovery to build your capsule collection.</p>
            <button
              onClick={onContinueShopping}
              className="px-4 py-2 rounded-xl bg-amber-500 text-stone-950 text-xs font-bold shadow"
            >
              Start Discovery
            </button>
          </div>
        ) : (
          <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
            {savedLooks.map((look) => (
              <div
                key={look.id}
                className="bg-stone-900 border border-stone-800 rounded-2xl p-3 flex gap-3 items-center shadow-lg hover:border-amber-500/40 transition-all"
              >
                {/* Look Thumbnail */}
                <div className="w-20 h-24 rounded-xl overflow-hidden bg-stone-950 shrink-0 border border-stone-800 relative">
                  <img src={look.imageUrl} alt={look.look_title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <span className="absolute bottom-1 left-1 bg-stone-950/80 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded text-amber-300 border border-stone-800">
                    {look.brand}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-serif font-bold text-sm text-amber-100 truncate mb-0.5">{look.look_title}</h4>
                  <span className="text-[10px] text-amber-400 font-mono block mb-1">{look.occasion}</span>
                  <p className="text-[11px] text-stone-300 line-clamp-1 mb-2">{look.top_garment}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-serif font-bold text-white">AED {look.priceAED.toLocaleString()}</span>
                    
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onRemoveLook(look.id)}
                        className="p-1.5 rounded-lg bg-stone-950 text-stone-400 hover:text-rose-400 border border-stone-800"
                        title="Remove look"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onBuyLook(look)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center gap-1 shadow"
                      >
                        <ShoppingCart className="w-3 h-3" />
                        <span>Buy</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Return to Discovery Button */}
      <button
        id="btn-return-discovery"
        onClick={onContinueShopping}
        className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 mt-4"
      >
        <span>Return to Swipe Discovery</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
