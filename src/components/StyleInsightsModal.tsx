import React, { useState, useEffect } from 'react';
import { Sparkles, X, CloudSun } from 'lucide-react';
import { StyleConstraints } from '../types';

interface StyleInsightsModalProps {
  onClose: () => void;
  constraints: StyleConstraints;
}

export const StyleInsightsModal: React.FC<StyleInsightsModalProps> = ({ onClose, constraints }) => {
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchInsight = async () => {
      try {
        const aesthetics = constraints.preferredAesthetics?.join(', ') || 'elegant luxury';
        const prompt = `You are a professional fashion stylist. Give me a 1-2 sentence daily fashion tip based on these aesthetics: ${aesthetics}. Incorporate a brief suggestion about dressing for today's general weather or season. Keep it concise, inspiring, and luxurious.`;
        
        const res = await fetch('/api/quick-tip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        });
        const data = await res.json();
        setInsight(data.tip);
      } catch (err) {
        console.error(err);
        setInsight('Embrace your unique style today. Try layering lightweight fabrics for a versatile, elegant look.');
      } finally {
        setLoading(false);
      }
    };

    fetchInsight();
  }, [constraints]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-fade-in-up relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-stone-800/50 text-stone-400 hover:text-stone-100 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>
        
        <div className="p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-2 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
            <CloudSun className="w-6 h-6 text-amber-400" />
          </div>
          <h2 className="font-serif text-xl font-bold text-amber-100">Daily Style Insight</h2>
          <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">Weather & Aesthetics</p>
          
          <div className="bg-stone-950 border border-stone-800 rounded-xl p-4 min-h-[100px] flex items-center justify-center relative overflow-hidden">
            <Sparkles className="absolute top-2 right-2 w-3 h-3 text-amber-500/30" />
            <Sparkles className="absolute bottom-2 left-2 w-3 h-3 text-amber-500/30" />
            {loading ? (
              <div className="text-amber-400 text-sm animate-pulse">Consulting your AI Stylist...</div>
            ) : (
              <p className="text-stone-200 text-sm italic font-serif leading-relaxed">
                "{insight}"
              </p>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="w-full py-3 mt-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
