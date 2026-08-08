import React, { useState, useRef } from 'react';
import { ClosetItem } from '../types';
import { Upload, Shirt, Package, MoreHorizontal, Layers, Plus } from 'lucide-react';

interface DigitalClosetProps {
  closetItems: ClosetItem[];
  onAddItems: (items: ClosetItem[]) => void;
}

const CATEGORIES = ['All', 'Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories'];

export const DigitalCloset: React.FC<DigitalClosetProps> = ({ closetItems, onAddItems }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      
      try {
        const res = await fetch('/api/scan-closet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64 })
        });
        
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          const newItems: ClosetItem[] = data.items.map((item: any, i: number) => ({
            id: `closet-${Date.now()}-${i}`,
            category: CATEGORIES.includes(item.category) ? item.category : 'Other',
            description: item.description || 'Unknown Item',
            color: item.color || 'Mixed',
            fabric: item.fabric,
            imageUrl: base64 // Display the original image (could ideally crop them, but we use original for now)
          }));
          onAddItems(newItems);
        }
      } catch (err) {
        console.error('Failed to scan closet', err);
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const filteredItems = activeCategory === 'All' 
    ? closetItems 
    : closetItems.filter(item => item.category === activeCategory);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold text-amber-50">Digital Closet</h2>
          <p className="text-stone-400 mt-1">Catalog your wardrobe to unlock smarter AI pairings.</p>
        </div>
        
        <div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning}
            className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-6 py-3 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isScanning ? (
              <MoreHorizontal className="w-5 h-5 animate-pulse" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
            {isScanning ? 'Scanning Items...' : 'Scan New Items'}
          </button>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex overflow-x-auto pb-4 mb-6 gap-2 no-scrollbar">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
              activeCategory === cat
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {closetItems.length === 0 && !isScanning ? (
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-12 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-stone-950 rounded-full flex items-center justify-center mb-4">
            <Package className="w-10 h-10 text-stone-600" />
          </div>
          <h3 className="font-serif text-xl font-bold text-stone-100 mb-2">Your closet is empty</h3>
          <p className="text-stone-400 max-w-sm mb-6">Take a photo of your clothes laid flat, and our AI will automatically catalog them.</p>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="text-amber-500 font-medium hover:text-amber-400 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add your first item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredItems.map(item => (
            <div key={item.id} className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden group">
              <div className="aspect-square bg-stone-950 relative">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.description} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Shirt className="w-8 h-8 text-stone-700" />
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-stone-950/80 backdrop-blur-md px-2 py-1 rounded text-[10px] font-mono text-amber-400 border border-stone-700">
                  {item.category}
                </div>
              </div>
              <div className="p-3">
                <h4 className="text-sm font-bold text-stone-100 line-clamp-1" title={item.description}>
                  {item.description}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-3 h-3 rounded-full border border-stone-700" style={{ backgroundColor: item.color }} title={item.color}></span>
                  <span className="text-xs text-stone-400">{item.color}</span>
                </div>
              </div>
            </div>
          ))}
          
          {isScanning && (
            <div className="bg-stone-900 border border-stone-800 rounded-2xl flex flex-col items-center justify-center p-6 min-h-[200px] border-dashed">
              <Layers className="w-8 h-8 text-amber-500/50 animate-bounce mb-3" />
              <span className="text-sm text-stone-400 text-center">Gemini is analyzing<br/>your wardrobe...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
