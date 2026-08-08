import React, { useState } from 'react';
import { Ruler, ShieldCheck, Sparkles, Check, ArrowRight, Activity, ChevronRight, Info } from 'lucide-react';
import { UserMeasurements, BrandSizeMapping, CapturedProfile } from '../types';
import { calculatePhotogrammetryMeasurements, mapMeasurementsToBrandSizes } from '../data/brandGrading';

interface SizingEngineProps {
  capturedProfile: CapturedProfile;
  onProceedToGuardrails: (measurements: UserMeasurements, brandSizes: BrandSizeMapping[]) => void;
}

export const SizingEngine: React.FC<SizingEngineProps> = ({
  capturedProfile,
  onProceedToGuardrails,
}) => {
  const measurements: UserMeasurements = calculatePhotogrammetryMeasurements(capturedProfile.heightCm);
  const brandSizes: BrandSizeMapping[] = mapMeasurementsToBrandSizes(measurements);

  const [activeTab, setActiveTab] = useState<'mesh' | 'brands'>('mesh');
  const [selectedBrand, setSelectedBrand] = useState<string>(brandSizes[0].brandName);

  return (
    <div id="module-sizing-engine" className="min-h-[85vh] bg-stone-950 text-stone-100 p-4 max-w-md mx-auto flex flex-col justify-between">
      {/* Header Banner */}
      <div className="text-center mb-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-medium mb-1">
          <Activity className="w-3.5 h-3.5" />
          <span>Module 2: 3D Photogrammetry Sizing</span>
        </div>
        <h2 className="text-xl font-serif font-bold text-amber-100">Volumetric Body Mesh</h2>
        <p className="text-xs text-stone-400">Cross-references height & profile mesh with luxury brand grading charts.</p>
      </div>

      {/* Tabs: 3D Wireframe Mesh vs Brand Grading Table */}
      <div className="flex bg-stone-900 p-1 rounded-xl border border-stone-800 mb-3">
        <button
          id="btn-tab-mesh"
          onClick={() => setActiveTab('mesh')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'mesh'
              ? 'bg-amber-500 text-stone-950 shadow-md'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          3D Mesh & Circumferences
        </button>
        <button
          id="btn-tab-brands"
          onClick={() => setActiveTab('brands')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'brands'
              ? 'bg-amber-500 text-stone-950 shadow-md'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          GCC Brand Size Mapping
        </button>
      </div>

      {activeTab === 'mesh' ? (
        /* Tab 1: Interactive Wireframe Mesh Visualizer */
        <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 shadow-xl flex-1 flex flex-col justify-between">
          <div className="relative aspect-[3/4] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center p-2 mb-3">
            {/* Background captured profile photo */}
            {capturedProfile.frontPhoto ? (
              <img
                src={capturedProfile.frontPhoto}
                alt="Captured silhouette"
                className="absolute inset-0 w-full h-full object-cover opacity-25 filter grayscale"
                referrerPolicy="no-referrer"
              />
            ) : null}

            {/* SVG Wireframe Photogrammetry Mesh */}
            <svg viewBox="0 0 200 300" className="w-full h-full z-10">
              {/* Central Spine Axis */}
              <line x1="100" y1="20" x2="100" y2="280" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />

              {/* Body Contour Mesh Lines */}
              <path d="M 100 25 Q 85 45 75 70 Q 60 110 70 140 Q 62 180 75 220 L 80 275" fill="none" stroke="#34d399" strokeWidth="1.5" />
              <path d="M 100 25 Q 115 45 125 70 Q 140 110 130 140 Q 138 180 125 220 L 120 275" fill="none" stroke="#34d399" strokeWidth="1.5" />

              {/* Horizontal Measurement Loops */}
              {/* Shoulders */}
              <line x1="68" y1="65" x2="132" y2="65" stroke="#f59e0b" strokeWidth="2" />
              <circle cx="68" cy="65" r="3" fill="#f59e0b" />
              <circle cx="132" cy="65" r="3" fill="#f59e0b" />

              {/* Bust/Chest */}
              <ellipse cx="100" cy="95" rx="32" ry="12" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="2 2" />
              <text x="140" y="98" fill="#38bdf8" fontSize="8" fontFamily="monospace" fontWeight="bold">Chest: {measurements.chestCm}cm</text>

              {/* Natural Waist */}
              <ellipse cx="100" cy="135" rx="24" ry="9" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="2 2" />
              <text x="135" y="138" fill="#38bdf8" fontSize="8" fontFamily="monospace" fontWeight="bold">Waist: {measurements.waistCm}cm</text>

              {/* Hips */}
              <ellipse cx="100" cy="175" rx="34" ry="14" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="2 2" />
              <text x="142" y="178" fill="#38bdf8" fontSize="8" fontFamily="monospace" fontWeight="bold">Hips: {measurements.hipsCm}cm</text>

              {/* Inseam */}
              <line x1="100" y1="185" x2="100" y2="265" stroke="#a7f3d0" strokeWidth="2" />
              <text x="110" y="230" fill="#a7f3d0" fontSize="8" fontFamily="monospace" fontWeight="bold">Inseam: {measurements.inseamCm}cm</text>
            </svg>

            {/* Confidence Rating Badge */}
            <div className="absolute top-2 right-2 bg-stone-900/90 border border-emerald-500/40 text-emerald-300 px-2 py-1 rounded-md text-[10px] font-mono flex items-center gap-1 shadow">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Mesh Confidence: 98%</span>
            </div>
          </div>

          {/* Measurement Metric Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800">
              <span className="text-stone-400 text-[10px] uppercase font-mono block">Chest / Bust</span>
              <span className="text-amber-300 font-serif font-bold text-base">{measurements.chestCm} cm</span>
            </div>
            <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800">
              <span className="text-stone-400 text-[10px] uppercase font-mono block">Natural Waist</span>
              <span className="text-amber-300 font-serif font-bold text-base">{measurements.waistCm} cm</span>
            </div>
            <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800">
              <span className="text-stone-400 text-[10px] uppercase font-mono block">Hips Circumference</span>
              <span className="text-amber-300 font-serif font-bold text-base">{measurements.hipsCm} cm</span>
            </div>
            <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800">
              <span className="text-stone-400 text-[10px] uppercase font-mono block">Inseam Length</span>
              <span className="text-amber-300 font-serif font-bold text-base">{measurements.inseamCm} cm</span>
            </div>
          </div>
        </div>
      ) : (
        /* Tab 2: Brand Grading Table */
        <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 shadow-xl flex-1 flex flex-col justify-between">
          <div className="space-y-2 mb-3 max-h-[50vh] overflow-y-auto pr-1">
            <div className="text-[11px] text-stone-400 font-sans mb-1 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              Cross-referenced against official brand grading charts:
            </div>

            {brandSizes.map((item, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedBrand(item.brandName)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  selectedBrand === item.brandName
                    ? 'bg-amber-500/10 border-amber-500 text-stone-100 shadow'
                    : 'bg-stone-950 border-stone-800 hover:border-stone-700 text-stone-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-serif font-bold text-sm text-stone-100">{item.brandName}</span>
                  <span className="bg-amber-500 text-stone-950 px-2 py-0.5 rounded text-xs font-mono font-bold">
                    {item.recommendedSize}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-stone-400">
                  <span>Tailoring Type: <strong className="text-stone-300">{item.fitsToType}</strong></span>
                  <span className="text-emerald-400 flex items-center gap-0.5"><Check className="w-3 h-3" /> Exact Match</span>
                </div>
                <p className="text-[10px] text-stone-400 mt-1 font-sans italic">{item.fitDescription}</p>
              </div>
            ))}
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl text-[11px] text-amber-200">
            <strong>Brand Mapping Verdict:</strong> Eliminates brand sizing guesswork. All discovery looks will display these exact size presets.
          </div>
        </div>
      )}

      {/* Primary Call to Action -> Style Guardrails */}
      <button
        id="btn-proceed-guardrails"
        onClick={() => onProceedToGuardrails(measurements, brandSizes)}
        className="w-full mt-3 py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2"
      >
        <span>Configure "Style Like You" Guardrails</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
