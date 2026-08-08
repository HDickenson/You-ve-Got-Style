import React, { useMemo, useState, useRef } from 'react';
import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { UserMeasurements, FashionLook } from '../types';
import { Activity, Info, Settings2, Minus, Plus, Ruler, Upload, Sparkles, CheckCircle } from 'lucide-react';

interface FitAnalyticsProps {
  measurements: UserMeasurements;
  savedLooks: FashionLook[];
  heightCm: number;
  onAdjustHeight: (height: number) => void;
}

interface BrandComparison {
  brandName: string;
  recommendedSize: string;
  fitNote: string;
  alignmentPercentage: number;
}

interface SizingAnalysis {
  garmentType: string;
  keyFitDetails: string;
  brandComparisons: BrandComparison[];
}

export const FitAnalytics: React.FC<FitAnalyticsProps> = ({ measurements, savedLooks, heightCm, onAdjustHeight }) => {
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [showSizingAssistant, setShowSizingAssistant] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sizingResult, setSizingResult] = useState<SizingAnalysis | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSizingPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      try {
        const res = await fetch('/api/analyze-sizing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64 })
        });
        const data = await res.json();
        if (data.garmentType && data.brandComparisons) {
          setSizingResult(data);
        }
      } catch (err) {
        console.error('Failed to analyze sizing photo', err);
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Generate mock fit analytics data based on measurements
  const radarData = useMemo(() => {
    return [
      { subject: 'Tops (Chest)', A: measurements.chestCm > 90 ? 85 : 92, fullMark: 100 },
      { subject: 'Bottoms (Waist)', A: measurements.waistCm > 75 ? 82 : 88, fullMark: 100 },
      { subject: 'Dresses (Hips)', A: measurements.hipsCm > 100 ? 78 : 94, fullMark: 100 },
      { subject: 'Outerwear', A: 90, fullMark: 100 },
      { subject: 'Shoes', A: 85, fullMark: 100 },
      { subject: 'Accessories', A: 95, fullMark: 100 },
    ];
  }, [measurements]);

  // Generate mock confidence scores for saved looks
  const barData = useMemo(() => {
    return savedLooks.map((look, index) => {
      // Mock confidence between 75 and 99
      const topConfidence = Math.floor(80 + Math.random() * 15);
      const bottomConfidence = Math.floor(75 + Math.random() * 20);
      return {
        name: look.look_title.substring(0, 15) + (look.look_title.length > 15 ? '...' : ''),
        'Top Fit': topConfidence,
        'Bottom Fit': bottomConfidence,
        'Overall': Math.floor((topConfidence + bottomConfidence) / 2),
      };
    });
  }, [savedLooks]);

  return (
    <div className="max-w-5xl mx-auto p-4 animate-fade-in-up">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-bold text-amber-100 flex items-center gap-2">
            <Activity className="w-6 h-6 text-amber-400" />
            Fit Analytics
          </h2>
          <p className="text-sm text-stone-400 mt-1">
            AI-driven alignment between your photogrammetry body measurements and saved looks.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              setShowSizingAssistant(!showSizingAssistant);
              if (isAdjusting) setIsAdjusting(false);
            }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border flex items-center gap-2 ${
              showSizingAssistant 
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' 
              : 'bg-stone-900 border-stone-800 text-stone-300 hover:text-white'
            }`}
          >
            <Ruler className="w-4 h-4 text-amber-400" />
            Sizing Assistant
          </button>

          <button 
            onClick={() => {
              setIsAdjusting(!isAdjusting);
              if (showSizingAssistant) setShowSizingAssistant(false);
            }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border flex items-center gap-2 ${
              isAdjusting 
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' 
              : 'bg-stone-900 border-stone-800 text-stone-300 hover:text-white'
            }`}
          >
            <Settings2 className="w-4 h-4" />
            Quick Adjust
          </button>
        </div>
      </div>

      {showSizingAssistant && (
        <div className="mb-6 bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-800 pb-4">
            <div>
              <h3 className="font-serif text-amber-50 font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                AI Sizing Assistant
              </h3>
              <p className="text-xs text-stone-400 mt-1">Upload a photo of your best-fitting shirt or suit for an ideal fit comparison across top luxury brands.</p>
            </div>
            
            <div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleSizingPhotoUpload} 
                accept="image/*" 
                className="hidden" 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing}
                className="bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {isAnalyzing ? 'Analyzing Fit Details...' : 'Upload Fit Photo'}
              </button>
            </div>
          </div>

          {isAnalyzing && (
            <div className="py-8 text-center text-amber-400 text-sm animate-pulse flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin" />
              Gemini is evaluating cut, drape, and armhole depth against luxury sizing charts...
            </div>
          )}

          {sizingResult && !isAnalyzing && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-400 font-mono uppercase tracking-wider">Garment: {sizingResult.garmentType}</span>
                <span className="text-xs text-amber-400 font-serif italic">{sizingResult.keyFitDetails}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {sizingResult.brandComparisons.map((brand, idx) => (
                  <div key={idx} className="bg-stone-950 border border-stone-800 rounded-xl p-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-stone-100">{brand.brandName}</span>
                        <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">{brand.recommendedSize}</span>
                      </div>
                      <p className="text-[11px] text-stone-400 leading-snug">{brand.fitNote}</p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-stone-900 flex items-center justify-between text-[10px]">
                      <span className="text-stone-500">Fit Match</span>
                      <span className="font-mono text-emerald-400 font-bold">{brand.alignmentPercentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {isAdjusting && (
        <div className="mb-6 bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <h3 className="font-serif text-amber-50 font-medium">Nudge Base Height</h3>
            <p className="text-xs text-stone-400 mt-1">Adjust your baseline profile to recalculate photogrammetry measurements slightly.</p>
          </div>
          <div className="flex items-center gap-4 bg-stone-950 p-2 rounded-xl border border-stone-800">
            <button 
              onClick={() => onAdjustHeight(Math.max(120, heightCm - 1))}
              className="p-2 rounded-lg bg-stone-900 text-stone-300 hover:text-amber-400 hover:bg-stone-800 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="text-center w-16">
              <span className="font-serif text-xl font-bold text-stone-100">{heightCm}</span>
              <span className="text-xs text-stone-500 block">cm</span>
            </div>
            <button 
              onClick={() => onAdjustHeight(Math.min(220, heightCm + 1))}
              className="p-2 rounded-lg bg-stone-900 text-stone-300 hover:text-amber-400 hover:bg-stone-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
        {/* Radar Chart for Measurement Alignment */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl flex flex-col h-[400px]">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-serif text-lg font-bold text-amber-50">Measurement Alignment</h3>
            <Info className="w-4 h-4 text-stone-500" />
          </div>
          <p className="text-xs text-stone-400 mb-4">Confidence score per garment type based on your 3D mesh points.</p>
          
          <div className="flex-1 w-full relative min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#44403c" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#d6d3d1', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#78716c', fontSize: 10 }} />
                <Radar name="Alignment Score" dataKey="A" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1c1917', borderColor: '#44403c', color: '#f5f5f4' }} 
                  itemStyle={{ color: '#f59e0b' }} 
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart for Saved Looks Fit Confidence */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl flex flex-col h-[400px]">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-serif text-lg font-bold text-amber-50">Capsule Confidence</h3>
            <Info className="w-4 h-4 text-stone-500" />
          </div>
          <p className="text-xs text-stone-400 mb-4">Fit prediction accuracy for your saved looks.</p>
          
          {savedLooks.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-stone-500 text-sm">
              Save some looks to view fit confidence.
            </div>
          ) : (
            <div className="flex-1 w-full relative min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#a8a29e', fontSize: 10 }} 
                    angle={-45} 
                    textAnchor="end" 
                    height={60} 
                  />
                  <YAxis domain={[0, 100]} tick={{ fill: '#a8a29e', fontSize: 10 }} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1c1917', borderColor: '#44403c', color: '#f5f5f4' }} 
                    cursor={{ fill: '#292524' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="Top Fit" fill="#d97706" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Bottom Fit" fill="#78350f" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
