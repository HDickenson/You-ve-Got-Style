import React, { useState, useEffect } from 'react';
import { Sparkles, X, CloudSun, Radar, ExternalLink } from 'lucide-react';
import { StyleConstraints } from '../types';

interface StyleInsightsModalProps {
  onClose: () => void;
  constraints: StyleConstraints;
}

interface Trend {
  title: string;
  description: string;
  source: string;
}

export const StyleInsightsModal: React.FC<StyleInsightsModalProps> = ({ onClose, constraints }) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'trends'>('daily');
  const [insight, setInsight] = useState<string>('');
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loadingDaily, setLoadingDaily] = useState<boolean>(true);
  const [loadingTrends, setLoadingTrends] = useState<boolean>(false);
  const [trendsFetched, setTrendsFetched] = useState<boolean>(false);

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
        setLoadingDaily(false);
      }
    };

    fetchInsight();
  }, [constraints]);

  const fetchTrends = async () => {
    if (trendsFetched) return;
    setLoadingTrends(true);
    try {
      const aesthetics = constraints.preferredAesthetics || [];
      const res = await fetch('/api/trend-radar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aesthetics })
      });
      const data = await res.json();
      setTrends(data.trends || []);
    } catch (err) {
      console.error(err);
      setTrends([]);
    } finally {
      setLoadingTrends(false);
      setTrendsFetched(true);
    }
  };

  useEffect(() => {
    if (activeTab === 'trends') {
      fetchTrends();
    }
  }, [activeTab]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-fade-in-up relative flex flex-col max-h-[80vh]">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-stone-800/50 text-stone-400 hover:text-stone-100 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>
        
        {/* Tabs */}
        <div className="flex border-b border-stone-800 pt-4 px-4 bg-stone-900">
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'daily' ? 'border-amber-500 text-amber-500' : 'border-transparent text-stone-400 hover:text-stone-200'}`}
          >
            Daily Tip
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'trends' ? 'border-amber-500 text-amber-500' : 'border-transparent text-stone-400 hover:text-stone-200'}`}
          >
            Trend Radar
          </button>
        </div>

        <div className="p-6 text-center overflow-y-auto">
          {activeTab === 'daily' ? (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-2 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                <CloudSun className="w-6 h-6 text-amber-400" />
              </div>
              <h2 className="font-serif text-xl font-bold text-amber-100">Daily Style Insight</h2>
              <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">Weather & Aesthetics</p>
              
              <div className="bg-stone-950 border border-stone-800 rounded-xl p-4 min-h-[100px] flex items-center justify-center relative overflow-hidden">
                <Sparkles className="absolute top-2 right-2 w-3 h-3 text-amber-500/30" />
                <Sparkles className="absolute bottom-2 left-2 w-3 h-3 text-amber-500/30" />
                {loadingDaily ? (
                  <div className="text-amber-400 text-sm animate-pulse">Consulting your AI Stylist...</div>
                ) : (
                  <p className="text-stone-200 text-sm italic font-serif leading-relaxed">
                    "{insight}"
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-left">
              <div className="flex items-center gap-2 justify-center mb-4">
                <Radar className="w-5 h-5 text-amber-400" />
                <h2 className="font-serif text-lg font-bold text-amber-100">Live Trend Radar</h2>
              </div>
              <p className="text-xs text-stone-400 text-center mb-4">Emerging trends matched to your aesthetics via Live Search Grounding.</p>
              
              {loadingTrends ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-3">
                  <Radar className="w-8 h-8 text-amber-500/50 animate-spin" />
                  <span className="text-sm text-amber-400/80 animate-pulse">Scanning fashion signals...</span>
                </div>
              ) : trends.length > 0 ? (
                <div className="space-y-3">
                  {trends.map((trend, i) => (
                    <div key={i} className="bg-stone-950 border border-stone-800 rounded-xl p-3">
                      <h3 className="text-sm font-bold text-stone-100 mb-1">{trend.title}</h3>
                      <p className="text-xs text-stone-300 mb-2 leading-relaxed">{trend.description}</p>
                      <div className="flex items-center gap-1 text-[10px] text-stone-500 uppercase">
                        <ExternalLink className="w-3 h-3" />
                        <span>Source: {trend.source}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-sm text-stone-400 py-4">No trends found at this time.</div>
              )}
            </div>
          )}
          
          <button
            onClick={onClose}
            className="w-full py-3 mt-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold transition-colors shrink-0"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
