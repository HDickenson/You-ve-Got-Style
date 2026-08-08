import React from 'react';
import { SlidersHorizontal, ShieldCheck, Check, Sparkles, ArrowRight, Ban, EyeOff, Layers } from 'lucide-react';
import { StyleConstraints } from '../types';

interface StyleGuardrailsProps {
  constraints: StyleConstraints;
  setConstraints: React.Dispatch<React.SetStateAction<StyleConstraints>>;
  onSaveAndProceed: () => void;
}

export const StyleGuardrails: React.FC<StyleGuardrailsProps> = ({
  constraints,
  setConstraints,
  onSaveAndProceed,
}) => {
  const toggleConstraint = (key: keyof StyleConstraints) => {
    setConstraints((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const applyPreset = (preset: 'modest_executive' | 'chic_casual' | 'gala_evening') => {
    if (preset === 'modest_executive') {
      setConstraints({
        modestWear: true,
        sleevesBelowElbow: true,
        noTrousers: false,
        hemlineBelowKnee: true,
        noNeonColors: true,
        noLoudPrints: true,
        preferredFabrics: ['Silk', 'Cashmere', 'Virgin Wool'],
        preferredAesthetics: ['Minimalist', 'Old Money'],
      });
    } else if (preset === 'chic_casual') {
      setConstraints({
        modestWear: true,
        sleevesBelowElbow: false,
        noTrousers: false,
        hemlineBelowKnee: true,
        noNeonColors: true,
        noLoudPrints: false,
        preferredFabrics: ['Linen', 'Cotton', 'Cashmere'],
        preferredAesthetics: ['Parisian Chic', 'Bohemian'],
      });
    } else if (preset === 'gala_evening') {
      setConstraints({
        modestWear: true,
        sleevesBelowElbow: true,
        noTrousers: true, // dresses only
        hemlineBelowKnee: true,
        noNeonColors: true,
        noLoudPrints: true,
        preferredFabrics: ['Silk Satin', 'Chiffon', 'Cashmere'],
        preferredAesthetics: ['Avant-Garde'],
      });
    }
  };

  const toggleFabric = (fabricName: string) => {
    setConstraints((prev) => {
      const exists = prev.preferredFabrics.includes(fabricName);
      return {
        ...prev,
        preferredFabrics: exists
          ? prev.preferredFabrics.filter((f) => f !== fabricName)
          : [...prev.preferredFabrics, fabricName],
      };
    });
  };

  return (
    <div id="module-style-guardrails" className="min-h-[85vh] bg-stone-950 text-stone-100 p-4 max-w-md mx-auto flex flex-col justify-between">
      {/* Title Header */}
      <div className="text-center mb-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-medium mb-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Module 4: "Style Like You" Guardrails</span>
        </div>
        <h2 className="text-xl font-serif font-bold text-amber-100">Personal Style Filter</h2>
        <p className="text-xs text-stone-400">Hard boundaries. The AI will NEVER show cards violating these rules.</p>
      </div>

      {/* Quick Presets Bar */}
      <div className="mb-3">
        <span className="text-[10px] uppercase font-mono text-stone-400 block mb-1">Quick Guardrail Presets:</span>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            id="preset-modest-exec"
            onClick={() => applyPreset('modest_executive')}
            className="px-2.5 py-1 rounded-full bg-stone-800 hover:bg-stone-700 border border-stone-700 text-xs text-amber-300 whitespace-nowrap"
          >
            GCC Modest Executive
          </button>
          <button
            id="preset-chic-casual"
            onClick={() => applyPreset('chic_casual')}
            className="px-2.5 py-1 rounded-full bg-stone-800 hover:bg-stone-700 border border-stone-700 text-xs text-amber-300 whitespace-nowrap"
          >
            Chic Resort Casual
          </button>
          <button
            id="preset-gala-evening"
            onClick={() => applyPreset('gala_evening')}
            className="px-2.5 py-1 rounded-full bg-stone-800 hover:bg-stone-700 border border-stone-700 text-xs text-amber-300 whitespace-nowrap"
          >
            Royal Gala (Skirts Only)
          </button>
        </div>
      </div>

      {/* Main Constraint Switches */}
      <div className="space-y-2 mb-3 bg-stone-900/90 border border-stone-800 rounded-2xl p-3.5 shadow-xl">
        <span className="text-xs font-semibold text-amber-200 block mb-2 uppercase tracking-wider font-mono">
          Absolute Style Boundaries:
        </span>

        {/* Constraint 1: Modest Wear */}
        <div
          onClick={() => toggleConstraint('modestWear')}
          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
            constraints.modestWear
              ? 'bg-amber-500/10 border-amber-500 text-stone-100 shadow'
              : 'bg-stone-950 border-stone-800 text-stone-400'
          }`}
        >
          <div>
            <div className="font-serif font-bold text-sm text-stone-100">Modest Wear Only</div>
            <div className="text-[11px] text-stone-400">Full body coverage, high necklines & opacity</div>
          </div>
          <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
            constraints.modestWear ? 'bg-amber-500 border-amber-400 text-stone-950 font-bold' : 'border-stone-700'
          }`}>
            {constraints.modestWear && <Check className="w-3.5 h-3.5" />}
          </div>
        </div>

        {/* Constraint 2: Sleeves Below Elbow */}
        <div
          onClick={() => toggleConstraint('sleevesBelowElbow')}
          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
            constraints.sleevesBelowElbow
              ? 'bg-amber-500/10 border-amber-500 text-stone-100 shadow'
              : 'bg-stone-950 border-stone-800 text-stone-400'
          }`}
        >
          <div>
            <div className="font-serif font-bold text-sm text-stone-100">Sleeves Below Elbow</div>
            <div className="text-[11px] text-stone-400">Rejects cap sleeves, tank tops & sleeveless cuts</div>
          </div>
          <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
            constraints.sleevesBelowElbow ? 'bg-amber-500 border-amber-400 text-stone-950 font-bold' : 'border-stone-700'
          }`}>
            {constraints.sleevesBelowElbow && <Check className="w-3.5 h-3.5" />}
          </div>
        </div>

        {/* Constraint 3: No Trousers */}
        <div
          onClick={() => toggleConstraint('noTrousers')}
          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
            constraints.noTrousers
              ? 'bg-amber-500/10 border-amber-500 text-stone-100 shadow'
              : 'bg-stone-950 border-stone-800 text-stone-400'
          }`}
        >
          <div>
            <div className="font-serif font-bold text-sm text-stone-100">No Trousers (Skirts & Dresses Only)</div>
            <div className="text-[11px] text-stone-400">Filters out pants, jeans, shorts & trousers</div>
          </div>
          <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
            constraints.noTrousers ? 'bg-amber-500 border-amber-400 text-stone-950 font-bold' : 'border-stone-700'
          }`}>
            {constraints.noTrousers && <Check className="w-3.5 h-3.5" />}
          </div>
        </div>

        {/* Constraint 4: Hemline Below Knee */}
        <div
          onClick={() => toggleConstraint('hemlineBelowKnee')}
          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
            constraints.hemlineBelowKnee
              ? 'bg-amber-500/10 border-amber-500 text-stone-100 shadow'
              : 'bg-stone-950 border-stone-800 text-stone-400'
          }`}
        >
          <div>
            <div className="font-serif font-bold text-sm text-stone-100">Hemline Below Knee</div>
            <div className="text-[11px] text-stone-400">Restricts hemlines to midi, maxi & floor length</div>
          </div>
          <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
            constraints.hemlineBelowKnee ? 'bg-amber-500 border-amber-400 text-stone-950 font-bold' : 'border-stone-700'
          }`}>
            {constraints.hemlineBelowKnee && <Check className="w-3.5 h-3.5" />}
          </div>
        </div>

        {/* Constraint 5: No Neon Colors */}
        <div
          onClick={() => toggleConstraint('noNeonColors')}
          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
            constraints.noNeonColors
              ? 'bg-amber-500/10 border-amber-500 text-stone-100 shadow'
              : 'bg-stone-950 border-stone-800 text-stone-400'
          }`}
        >
          <div>
            <div className="font-serif font-bold text-sm text-stone-100">No Neon or Loud Colors</div>
            <div className="text-[11px] text-stone-400">Restricts palette to neutrals, earth & jewel tones</div>
          </div>
          <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
            constraints.noNeonColors ? 'bg-amber-500 border-amber-400 text-stone-950 font-bold' : 'border-stone-700'
          }`}>
            {constraints.noNeonColors && <Check className="w-3.5 h-3.5" />}
          </div>
        </div>
      </div>

      {/* Preferred Fabric Selector */}
      <div className="mb-3 bg-stone-900/90 border border-stone-800 rounded-2xl p-3 shadow-md">
        <span className="text-[11px] uppercase font-mono text-stone-400 block mb-1.5">
          Luxury Preferred Fabrics:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {['Mulberry Silk', 'Baby Cashmere', 'Virgin Wool', 'Raw Linen', 'Heavy Satin'].map((fab) => {
            const isSelected = constraints.preferredFabrics.includes(fab);
            return (
              <button
                key={fab}
                onClick={() => toggleFabric(fab)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                    : 'bg-stone-950 text-stone-300 border border-stone-800 hover:border-stone-700'
                }`}
              >
                {fab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Preferred Fashion Aesthetics */}
      <div className="mb-3 bg-stone-900/90 border border-stone-800 rounded-2xl p-3 shadow-md">
        <span className="text-[11px] uppercase font-mono text-stone-400 block mb-1.5">
          Preferred Fashion Aesthetics:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {['Parisian Chic', 'Minimalist', 'Avant-Garde', 'Old Money', 'Bohemian', 'Streetwear'].map((aesthetic) => {
            const isSelected = constraints.preferredAesthetics?.includes(aesthetic);
            return (
              <button
                key={aesthetic}
                onClick={() => {
                  setConstraints((prev) => {
                    const current = prev.preferredAesthetics || [];
                    const exists = current.includes(aesthetic);
                    return {
                      ...prev,
                      preferredAesthetics: exists
                        ? current.filter((a) => a !== aesthetic)
                        : [...current, aesthetic],
                    };
                  });
                }}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                    : 'bg-stone-950 text-stone-300 border border-stone-800 hover:border-stone-700'
                }`}
              >
                {aesthetic}
              </button>
            );
          })}
        </div>
      </div>

      {/* Save & Launch Discovery */}
      <button
        id="btn-save-guardrails"
        onClick={onSaveAndProceed}
        className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2"
      >
        <span>Lock Guardrails & Enter Discovery</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
