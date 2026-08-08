import React, { useMemo } from 'react';
import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { UserMeasurements, FashionLook } from '../types';
import { Activity, Info } from 'lucide-react';

interface FitAnalyticsProps {
  measurements: UserMeasurements;
  savedLooks: FashionLook[];
}

export const FitAnalytics: React.FC<FitAnalyticsProps> = ({ measurements, savedLooks }) => {
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
      </div>

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
