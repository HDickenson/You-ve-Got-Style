import React, { useState, useRef, PointerEvent } from 'react';
import { FashionLook, MoodboardItem } from '../types';
import { X, Grid, Info } from 'lucide-react';

interface MoodboardProps {
  savedLooks: FashionLook[];
}

export const Moodboard: React.FC<MoodboardProps> = ({ savedLooks }) => {
  const [items, setItems] = useState<MoodboardItem[]>([]);
  const [maxZIndex, setMaxZIndex] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);

  // For dragging items on canvas using pointer events
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Handle HTML5 drop from sidebar
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;
      const data = JSON.parse(dataStr);
      
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const newX = e.clientX - rect.left - 64; // roughly center of 128px width
      const newY = e.clientY - rect.top - 64; 

      const newItem: MoodboardItem = {
        id: Math.random().toString(36).substr(2, 9),
        sourceLookId: data.sourceLookId,
        type: data.type,
        description: data.desc,
        imageUrl: data.imageUrl,
        x: newX,
        y: newY,
        zIndex: maxZIndex + 1
      };
      
      setMaxZIndex(maxZIndex + 1);
      setItems([...items, newItem]);
    } catch (err) {
      console.error("Drop error", err);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // necessary to allow dropping
  };

  const addItemToCenter = (sourceLookId: string, type: 'top' | 'bottom' | 'dress' | 'look', desc: string, imageUrl: string) => {
    const newItem: MoodboardItem = {
      id: Math.random().toString(36).substr(2, 9),
      sourceLookId,
      type,
      description: desc,
      imageUrl,
      x: 100 + Math.random() * 100,
      y: 100 + Math.random() * 100,
      zIndex: maxZIndex + 1
    };
    setMaxZIndex(maxZIndex + 1);
    setItems([...items, newItem]);
  };

  // Pointer events for canvas dragging
  const handlePointerDown = (e: PointerEvent<HTMLDivElement>, id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    setDraggingId(id);
    setDragOffset({
      x: e.clientX - item.x,
      y: e.clientY - item.y
    });
    
    const newZ = maxZIndex + 1;
    setMaxZIndex(newZ);
    setItems(items.map(i => i.id === id ? { ...i, zIndex: newZ } : i));

    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!draggingId) return;
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    setItems(items.map(i => i.id === draggingId ? { ...i, x: newX, y: newY } : i));
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (draggingId) {
      (e.target as Element).releasePointerCapture(e.pointerId);
      setDraggingId(null);
    }
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  return (
    <div className="max-w-7xl mx-auto p-4 flex flex-col md:flex-row gap-6 h-[85vh]">
      {/* Sidebar with Saved Looks */}
      <div className="w-full md:w-80 flex-shrink-0 bg-stone-900 border border-stone-800 rounded-2xl p-4 flex flex-col h-[30vh] md:h-full overflow-y-auto">
        <h2 className="font-serif text-xl font-bold text-amber-400 flex items-center gap-2 mb-4">
          <Grid className="w-5 h-5" /> Liked Garments
        </h2>
        <div className="text-xs text-stone-400 mb-4 flex items-start gap-2 bg-stone-950 p-2 rounded-lg border border-stone-800">
          <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p>Drag garments from your saved looks onto the moodboard to compose custom combinations.</p>
        </div>
        
        {savedLooks.length === 0 ? (
          <div className="text-center text-stone-500 text-sm mt-8">
            No saved looks yet.<br/>Save some from Discovery!
          </div>
        ) : (
          <div className="space-y-4">
            {savedLooks.map(look => (
              <div key={look.id} className="bg-stone-950 border border-stone-800 rounded-xl p-3 shadow-md">
                <div className="flex gap-3 mb-3">
                  <img src={look.imageUrl} draggable={false} className="w-16 h-20 object-cover rounded-lg border border-stone-800" />
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-sm font-bold text-amber-100 truncate">{look.look_title}</p>
                    <p className="text-xs text-stone-400 truncate">{look.brand}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div 
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('application/json', JSON.stringify({ sourceLookId: look.id, type: 'top', desc: look.top_garment, imageUrl: look.imageUrl }))}
                    onClick={() => addItemToCenter(look.id, 'top', look.top_garment, look.imageUrl)}
                    className="w-full text-left text-xs bg-stone-900 hover:bg-stone-800 border border-stone-800 rounded px-2 py-1.5 transition-colors truncate cursor-grab"
                  >
                    + Top: {look.top_garment}
                  </div>
                  <div 
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('application/json', JSON.stringify({ sourceLookId: look.id, type: 'bottom', desc: look.bottom_garment, imageUrl: look.imageUrl }))}
                    onClick={() => addItemToCenter(look.id, 'bottom', look.bottom_garment, look.imageUrl)}
                    className="w-full text-left text-xs bg-stone-900 hover:bg-stone-800 border border-stone-800 rounded px-2 py-1.5 transition-colors truncate cursor-grab"
                  >
                    + Bottom: {look.bottom_garment}
                  </div>
                  {look.dress_garment && (
                    <div 
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('application/json', JSON.stringify({ sourceLookId: look.id, type: 'dress', desc: look.dress_garment, imageUrl: look.imageUrl }))}
                      onClick={() => addItemToCenter(look.id, 'dress', look.dress_garment!, look.imageUrl)}
                      className="w-full text-left text-xs bg-stone-900 hover:bg-stone-800 border border-stone-800 rounded px-2 py-1.5 transition-colors truncate cursor-grab"
                    >
                      + Dress: {look.dress_garment}
                    </div>
                  )}
                  <div 
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('application/json', JSON.stringify({ sourceLookId: look.id, type: 'look', desc: look.look_title, imageUrl: look.imageUrl }))}
                    onClick={() => addItemToCenter(look.id, 'look', look.look_title, look.imageUrl)}
                    className="w-full text-left text-xs bg-stone-900 hover:bg-stone-800 border border-amber-900/30 text-amber-400/80 rounded px-2 py-1.5 transition-colors truncate cursor-grab"
                  >
                    + Full Look
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Canvas */}
      <div 
        ref={canvasRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="flex-1 bg-stone-900 border border-stone-800 rounded-2xl relative overflow-hidden h-[50vh] md:h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-stone-800/40 via-stone-900 to-stone-950"
      >
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        
        {items.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-stone-500 font-serif text-lg pointer-events-none">
            Drop garments here to build an outfit
          </div>
        )}
        
        {items.map(item => (
          <div
            key={item.id}
            onPointerDown={(e) => handlePointerDown(e, item.id)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{
              position: 'absolute',
              left: item.x,
              top: item.y,
              zIndex: item.zIndex,
              touchAction: 'none'
            }}
            className="w-32 bg-stone-950 border border-stone-800 rounded-lg p-1.5 shadow-2xl cursor-grab active:cursor-grabbing hover:border-amber-500/50 transition-colors group select-none"
          >
            <div className="relative">
              {item.type === 'look' ? (
                <img src={item.imageUrl} draggable={false} className="w-full h-32 object-cover rounded pointer-events-none" />
              ) : (
                <div className="w-full h-24 bg-stone-900 rounded border border-stone-800 flex items-center justify-center pointer-events-none overflow-hidden relative">
                  <img src={item.imageUrl} draggable={false} className="absolute inset-0 w-full h-full object-cover opacity-30 filter blur-[2px]" />
                  <span className="relative text-[10px] font-bold text-amber-500 bg-stone-950/80 px-2 py-1 rounded backdrop-blur-sm z-10 uppercase">{item.type}</span>
                </div>
              )}
              <button 
                onPointerDown={(e) => { e.stopPropagation(); removeItem(item.id); }}
                className="absolute -top-2 -right-2 bg-stone-800 border border-stone-700 text-stone-300 hover:bg-rose-500 hover:text-white hover:border-rose-400 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all shadow-lg z-20"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <p className="text-[10px] text-stone-300 mt-1.5 truncate text-center font-mono pointer-events-none">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
