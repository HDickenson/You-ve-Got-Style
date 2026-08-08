import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, MessageCircle, Zap, Camera, Mic, Image as ImageIcon } from 'lucide-react';

export const AIFeatures: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'live' | 'image' | 'analyze' | 'tip'>('chat');
  
  // Quick Tip State
  const [quickTip, setQuickTip] = useState<string>('');
  
  // Chat State
  const [chatHistory, setChatHistory] = useState<{role: string, text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  
  // Image Generation State
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageModel, setImageModel] = useState('gemini-3-pro-image-preview');
  const [imageSize, setImageSize] = useState('1K');
  const [imageRatio, setImageRatio] = useState('1:1');
  const [generatedImage, setGeneratedImage] = useState('');
  
  // Image Analysis State
  const [analysisImage, setAnalysisImage] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  
  // Live Voice State
  const [isLiveActive, setIsLiveActive] = useState(false);
  const liveWs = useRef<WebSocket | null>(null);
  
  const fetchQuickTip = async () => {
    try {
      const res = await fetch('/api/quick-tip', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const data = await res.json();
      setQuickTip(data.tip);
    } catch (e) {
      console.error(e);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;
    const currentMessage = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: currentMessage }]);
    
    try {
      const res = await fetch('/api/chat', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentMessage, modelName: 'gemini-3.1-pro-preview' }) 
      });
      const data = await res.json();
      setChatHistory(prev => [...prev, { role: 'model', text: data.response }]);
    } catch (e) {
      console.error(e);
    }
  };

  const generateImage = async () => {
    if (!imagePrompt.trim()) return;
    setGeneratedImage('loading');
    try {
      const res = await fetch('/api/generate-tryon', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: imagePrompt, 
          modelName: imageModel,
          imageSize: imageSize,
          aspectRatio: imageRatio
        }) 
      });
      const data = await res.json();
      setGeneratedImage(data.imageUrl);
    } catch (e) {
      console.error(e);
      setGeneratedImage('');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAnalysisImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeUploadedImage = async () => {
    if (!analysisImage) return;
    setAnalysisResult('loading');
    try {
      const res = await fetch('/api/analyze-image', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userPhotoBase64: analysisImage }) 
      });
      const data = await res.json();
      setAnalysisResult(data.analysis);
    } catch (e) {
      console.error(e);
      setAnalysisResult('Error analyzing image.');
    }
  };

  const toggleLiveVoice = async () => {
    if (isLiveActive) {
      liveWs.current?.close();
      liveWs.current = null;
      setIsLiveActive(false);
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/live`);
      
      const inputAudioCtx = new AudioContext({ sampleRate: 16000 });
      const outputAudioCtx = new AudioContext({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = inputAudioCtx.createMediaStreamSource(stream);
      const processor = inputAudioCtx.createScriptProcessor(4096, 1, 1);
      
      source.connect(processor);
      processor.connect(inputAudioCtx.destination);
      
      processor.onaudioprocess = (e) => {
        if (ws.readyState === 1) {
          const channelData = e.inputBuffer.getChannelData(0);
          let pcm16 = new Int16Array(channelData.length);
          for (let i = 0; i < channelData.length; i++) {
            let s = Math.max(-1, Math.min(1, channelData[i]));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }
          let binary = '';
          const bytes = new Uint8Array(pcm16.buffer);
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = btoa(binary);
          ws.send(JSON.stringify({ audio: base64 }));
        }
      };

      ws.onmessage = async (event) => {
        const msg = JSON.parse(event.data);
        if (msg.audio) {
          const binaryStr = atob(msg.audio);
          const bytes = new Uint8Array(binaryStr.length);
          for(let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          const pcm16 = new Int16Array(bytes.buffer);
          const audioBuffer = outputAudioCtx.createBuffer(1, pcm16.length, 24000);
          const channelData = audioBuffer.getChannelData(0);
          for(let i=0; i<pcm16.length; i++) {
            channelData[i] = pcm16[i] / 0x8000;
          }
          const sourceNode = outputAudioCtx.createBufferSource();
          sourceNode.buffer = audioBuffer;
          sourceNode.connect(outputAudioCtx.destination);
          sourceNode.start();
        }
      };

      liveWs.current = ws;
      setIsLiveActive(true);
    } catch (e) {
      console.error(e);
      alert('Microphone access denied or error connecting.');
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-6 text-stone-100 min-h-[85vh]">
      <div className="text-center mb-6">
        <h2 className="font-serif text-2xl font-bold text-amber-400">Gemini Intelligence</h2>
        <p className="text-xs font-mono text-stone-400 mt-1">Multi-model capabilities suite</p>
      </div>

      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none">
        <button onClick={() => setActiveTab('chat')} className={`px-4 py-2 rounded-full whitespace-nowrap text-xs font-bold transition-colors ${activeTab === 'chat' ? 'bg-amber-500 text-stone-950' : 'bg-stone-900 text-stone-400 border border-stone-800'}`}>Stylist Chat</button>
        <button onClick={() => setActiveTab('image')} className={`px-4 py-2 rounded-full whitespace-nowrap text-xs font-bold transition-colors ${activeTab === 'image' ? 'bg-amber-500 text-stone-950' : 'bg-stone-900 text-stone-400 border border-stone-800'}`}>Generate Look</button>
        <button onClick={() => setActiveTab('analyze')} className={`px-4 py-2 rounded-full whitespace-nowrap text-xs font-bold transition-colors ${activeTab === 'analyze' ? 'bg-amber-500 text-stone-950' : 'bg-stone-900 text-stone-400 border border-stone-800'}`}>Analyze Style</button>
        <button onClick={() => setActiveTab('live')} className={`px-4 py-2 rounded-full whitespace-nowrap text-xs font-bold transition-colors ${activeTab === 'live' ? 'bg-amber-500 text-stone-950' : 'bg-stone-900 text-stone-400 border border-stone-800'}`}>Live Voice</button>
        <button onClick={() => setActiveTab('tip')} className={`px-4 py-2 rounded-full whitespace-nowrap text-xs font-bold transition-colors ${activeTab === 'tip' ? 'bg-amber-500 text-stone-950' : 'bg-stone-900 text-stone-400 border border-stone-800'}`}>Quick Tip</button>
      </div>

      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-xl">
        {activeTab === 'chat' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-stone-400 text-xs font-mono mb-2">
              <MessageCircle className="w-4 h-4 text-amber-400" /> Powered by gemini-3.1-pro-preview
            </div>
            <div className="h-64 overflow-y-auto space-y-3 bg-stone-950 p-3 rounded-xl border border-stone-800">
              {chatHistory.length === 0 ? (
                <p className="text-stone-500 text-sm text-center mt-10">Ask for styling advice...</p>
              ) : (
                chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-2.5 rounded-xl max-w-[85%] text-sm ${msg.role === 'user' ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-200'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                placeholder="Ask about a trend..."
                className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-sm text-stone-200 focus:outline-none focus:border-amber-500"
              />
              <button onClick={sendChatMessage} className="bg-amber-500 text-stone-950 px-4 py-2 rounded-xl font-bold">Send</button>
            </div>
          </div>
        )}

        {activeTab === 'image' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-stone-400 text-xs font-mono mb-2">
              <ImageIcon className="w-4 h-4 text-amber-400" /> High-Quality Generation
            </div>
            <textarea 
              value={imagePrompt}
              onChange={e => setImagePrompt(e.target.value)}
              placeholder="Describe a luxury outfit in a studio setting..."
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-sm text-stone-200 focus:outline-none focus:border-amber-500"
              rows={3}
            />
            <div className="grid grid-cols-2 gap-2">
              <select value={imageModel} onChange={e => setImageModel(e.target.value)} className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200">
                <option value="gemini-3-pro-image-preview">Pro Image (Studio)</option>
                <option value="gemini-3.1-flash-image-preview">Flash Image</option>
              </select>
              <select value={imageSize} onChange={e => setImageSize(e.target.value)} className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200">
                <option value="1K">1K Size</option>
                <option value="2K">2K Size</option>
                <option value="4K">4K Size</option>
              </select>
              <select value={imageRatio} onChange={e => setImageRatio(e.target.value)} className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 col-span-2">
                <option value="1:1">1:1 Square</option>
                <option value="3:4">3:4 Portrait</option>
                <option value="4:3">4:3 Landscape</option>
                <option value="9:16">9:16 Vertical</option>
                <option value="16:9">16:9 Widescreen</option>
                <option value="21:9">21:9 Cinematic</option>
              </select>
            </div>
            <button onClick={generateImage} className="w-full bg-amber-500 text-stone-950 py-3 rounded-xl font-bold">Generate Image</button>
            {generatedImage === 'loading' && <div className="text-center py-8 text-amber-400 text-sm animate-pulse">Rendering pixels...</div>}
            {generatedImage && generatedImage !== 'loading' && (
              <img src={generatedImage} alt="Generated" className="w-full h-auto rounded-xl shadow-lg border border-stone-800" />
            )}
          </div>
        )}

        {activeTab === 'analyze' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-stone-400 text-xs font-mono mb-2">
              <Camera className="w-4 h-4 text-amber-400" /> Visual Analysis (gemini-3.1-pro-preview)
            </div>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-sm text-stone-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-stone-800 file:text-amber-400 hover:file:bg-stone-700" />
            {analysisImage && <img src={analysisImage} alt="To analyze" className="w-full max-h-48 object-cover rounded-xl border border-stone-800" />}
            <button onClick={analyzeUploadedImage} disabled={!analysisImage} className="w-full bg-amber-500 text-stone-950 py-3 rounded-xl font-bold disabled:opacity-50">Analyze Photo</button>
            {analysisResult === 'loading' && <div className="text-center py-4 text-amber-400 text-sm animate-pulse">Analyzing fabric and fit...</div>}
            {analysisResult && analysisResult !== 'loading' && (
              <div className="p-3 bg-stone-950 border border-stone-800 rounded-xl text-sm text-stone-300">
                {analysisResult}
              </div>
            )}
          </div>
        )}

        {activeTab === 'live' && (
          <div className="space-y-6 text-center py-8">
            <div className="flex items-center justify-center gap-2 text-stone-400 text-xs font-mono mb-2">
              <Mic className="w-4 h-4 text-amber-400" /> Live Voice (gemini-3.1-flash-live-preview)
            </div>
            <p className="text-sm text-stone-300">Talk to your AI Stylist in real-time.</p>
            <button 
              onClick={toggleLiveVoice}
              className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center transition-all shadow-2xl border-4 ${isLiveActive ? 'bg-rose-500 border-rose-400 animate-pulse text-white' : 'bg-stone-800 border-stone-700 text-amber-400 hover:bg-stone-700'}`}
            >
              <Mic className="w-8 h-8" />
            </button>
            <p className="text-xs font-bold uppercase tracking-wider text-stone-400">{isLiveActive ? 'Listening... Tap to End' : 'Tap to Start'}</p>
          </div>
        )}

        {activeTab === 'tip' && (
          <div className="space-y-4 text-center py-8">
            <div className="flex items-center justify-center gap-2 text-stone-400 text-xs font-mono mb-2">
              <Zap className="w-4 h-4 text-amber-400" /> Low Latency (gemini-3.1-flash-lite)
            </div>
            <button onClick={fetchQuickTip} className="w-full bg-amber-500 text-stone-950 py-3 rounded-xl font-bold">Get Instant Tip</button>
            {quickTip && (
              <div className="mt-6 p-6 bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-2xl">
                <p className="font-serif text-lg text-amber-200 italic">"{quickTip}"</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
