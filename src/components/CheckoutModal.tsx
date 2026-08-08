import React, { useState } from 'react';
import { X, ShoppingBag, ShieldCheck, CheckCircle2, Truck, CreditCard, Sparkles, MapPin } from 'lucide-react';
import { FashionLook, BrandSizeMapping } from '../types';

interface CheckoutModalProps {
  look: FashionLook | null;
  brandSizes: BrandSizeMapping[];
  onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  look,
  brandSizes,
  onClose,
}) => {
  const [isOrdered, setIsOrdered] = useState<boolean>(false);
  const [selectedCity, setSelectedCity] = useState<string>('Dubai, UAE (Same Day Delivery)');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!look) return null;

  const handleAtomicCheckout = () => {
    setIsProcessing(true);
    // Simulate Atomic Checkout Redis ATP lock
    setTimeout(() => {
      setIsProcessing(false);
      setIsOrdered(true);
    }, 1200);
  };

  return (
    <div id="checkout-modal-backdrop" className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-end sm:items-center justify-center p-3 transition-all">
      <div className="bg-stone-900 border border-stone-800 text-stone-100 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl p-5 max-h-[90vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-amber-100">Atomic Checkout</h3>
              <p className="text-[10px] text-stone-400 font-mono">GCC Direct Courier • Size Locked</p>
            </div>
          </div>
          <button
            id="btn-close-checkout"
            onClick={onClose}
            className="p-1.5 rounded-full bg-stone-800 text-stone-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isOrdered ? (
          /* Order Confirmed Screen */
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 flex items-center justify-center mx-auto mb-3 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-serif font-bold text-amber-100 mb-1">Order Confirmed!</h3>
            <p className="text-xs text-stone-300 max-w-xs mx-auto mb-4">
              Your tailored look <strong>"{look.look_title}"</strong> has been reserved. Delivered directly to {selectedCity}.
            </p>

            <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 text-left text-xs space-y-1.5 font-mono mb-4">
              <div className="flex justify-between text-stone-400">
                <span>Order Ref:</span>
                <span className="text-amber-400 font-bold">#YGS-88492</span>
              </div>
              <div className="flex justify-between text-stone-400">
                <span>Brand & Size:</span>
                <span className="text-stone-200">{look.brand} ({look.brand_sizes?.[0]?.recommendedSize || 'Standard'})</span>
              </div>
              <div className="flex justify-between text-stone-400">
                <span>Total Paid:</span>
                <span className="text-emerald-400 font-bold">AED {look.priceAED.toLocaleString()}</span>
              </div>
            </div>

            <button
              id="btn-close-confirmed"
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs"
            >
              Done & Return to Stylist
            </button>
          </div>
        ) : (
          /* Checkout Breakdown Screen */
          <div>
            {/* Look Summary */}
            <div className="flex gap-3 bg-stone-950 p-3 rounded-xl border border-stone-800 mb-3">
              <img
                src={look.imageUrl}
                alt={look.look_title}
                className="w-16 h-20 object-cover rounded-lg border border-stone-800 shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1">
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">{look.brand}</span>
                <h4 className="font-serif font-bold text-sm text-stone-100 leading-snug">{look.look_title}</h4>
                <p className="text-[11px] text-stone-400 line-clamp-1 mt-1">{look.top_garment}</p>
                <span className="text-xs font-serif font-bold text-emerald-400 block mt-1">
                  AED {look.priceAED.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Sizing Engine Preset Mapping */}
            <div className="bg-stone-950/80 p-3 rounded-xl border border-stone-800 mb-3">
              <span className="text-[10px] uppercase font-mono text-stone-400 block mb-1">
                3D Photogrammetry Size Reservation:
              </span>
              <div className="space-y-1">
                {look.brand_sizes?.map((bs, i) => (
                  <div key={i} className="flex justify-between text-xs font-mono py-0.5 border-b border-stone-900 last:border-none">
                    <span className="text-stone-300">{bs.brandName}:</span>
                    <span className="text-amber-300 font-bold">{bs.recommendedSize} ({bs.fitsToType})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* GCC Shipping Selection */}
            <div className="mb-4">
              <label htmlFor="delivery-city-select" className="text-xs font-semibold text-stone-300 block mb-1">
                Select GCC Express Delivery Destination:
              </label>
              <select
                id="delivery-city-select"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 text-stone-200 rounded-xl p-2.5 text-xs focus:border-amber-500 outline-none"
              >
                <option>Dubai, UAE (Same Day Courier)</option>
                <option>Abu Dhabi, UAE (Next Morning)</option>
                <option>Riyadh, KSA (Express 24h)</option>
                <option>Jeddah, KSA (Express 24h)</option>
                <option>Doha, Qatar (Express 24h)</option>
                <option>Kuwait City, Kuwait (Express 24h)</option>
              </select>
            </div>

            {/* Instant Atomic Purchase CTA */}
            <button
              id="btn-confirm-atomic-checkout"
              onClick={handleAtomicCheckout}
              disabled={isProcessing}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-bold text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>{isProcessing ? 'Securing Inventory Lock...' : `Confirm Purchase (AED ${look.priceAED.toLocaleString()})`}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
