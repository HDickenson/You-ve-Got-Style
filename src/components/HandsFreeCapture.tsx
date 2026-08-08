import React, { useState, useEffect, useRef } from 'react';
import { Camera, Mic, CheckCircle2, ShieldAlert, Sparkles, RefreshCw, Upload, Volume2, Info, ArrowRight, Smartphone } from 'lucide-react';
import { CapturedProfile } from '../types';

interface HandsFreeCaptureProps {
  onCaptureComplete: (profile: CapturedProfile) => void;
  heightCm: number;
  setHeightCm: (height: number) => void;
}

export const HandsFreeCapture: React.FC<HandsFreeCaptureProps> = ({
  onCaptureComplete,
  heightCm,
  setHeightCm,
}) => {
  // Sensor State
  const [pitchAngle, setPitchAngle] = useState<number>(82); // Simulated pitch initially slightly off 90°
  const [isSensorVerified, setIsSensorVerified] = useState<boolean>(false);
  const [autoLevelActive, setAutoLevelActive] = useState<boolean>(true);

  // Voice & Capture State
  const [captureStep, setCaptureStep] = useState<'sensor' | 'front' | 'side' | 'ready'>('sensor');
  const [voiceInstruction, setVoiceInstruction] = useState<string>(
    "Prop your device vertically at 90°. The screen will unlock when aligned."
  );
  const [isListening, setIsListening] = useState<boolean>(false);
  const [frontPhoto, setFrontPhoto] = useState<string | null>(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'
  );
  const [sidePhoto, setSidePhoto] = useState<string | null>(
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80'
  );
  const [webcamActive, setWebcamActive] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Accelerometer / Gyroscope Hook with Web API fallback
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta !== null) {
        const beta = Math.abs(e.beta); // Beta represents front-to-back tilt
        setPitchAngle(Math.round(beta * 10) / 10);
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => {
      if (window.DeviceOrientationEvent) {
        window.removeEventListener('deviceorientation', handleOrientation);
      }
    };
  }, []);

  // Sensor Verification Logic
  useEffect(() => {
    const isVert = Math.abs(pitchAngle - 90) <= 3;
    setIsSensorVerified(isVert);

    if (isVert && captureStep === 'sensor') {
      setVoiceInstruction("Perfect 90° alignment detected! Step back 2 steps. Say 'Snap' when ready for Front Shot.");
      setCaptureStep('front');
    }
  }, [pitchAngle, captureStep]);

  // Voice Assistant Speech Recognition (Web Speech API)
  const startVoiceListener = () => {
    setIsListening(true);
    setVoiceInstruction("Listening for 'Snap' voice trigger...");

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        if (transcript.includes('snap') || transcript.includes('cheese') || transcript.includes('shoot') || transcript.includes('take')) {
          triggerCapture();
        } else {
          setVoiceInstruction(`Heard "${transcript}". Please say "Snap"!`);
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
        setVoiceInstruction("Voice listening paused. Tap 'Snap' or say 'Snap' again.");
      };

      recognition.start();
    } else {
      // Fallback simulated voice trigger after 2.5 seconds
      setTimeout(() => {
        setIsListening(false);
        triggerCapture();
      }, 2500);
    }
  };

  const playSuccessSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      oscillator.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1); // A6
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.warn('Audio feedback not supported', e);
    }
  };

  const triggerCapture = () => {
    playSuccessSound();
    if (captureStep === 'front' || captureStep === 'sensor') {
      setCaptureStep('side');
      setVoiceInstruction("Front photo locked! Now turn 90° for your Side Profile shot. Say 'Snap' when ready.");
    } else if (captureStep === 'side') {
      setCaptureStep('ready');
      setVoiceInstruction("All photogrammetry profiles captured! Processing 3D mesh measurements...");
    }
  };

  // Start webcam preview
  const enableWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setWebcamActive(true);
      }
    } catch (err) {
      console.warn("Camera access unavailable or iframe restricted:", err);
      setWebcamActive(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, profile: 'front' | 'side') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (profile === 'front') setFrontPhoto(reader.result as string);
        else setSidePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProceedToSizing = () => {
    onCaptureComplete({
      frontPhoto,
      sidePhoto,
      heightCm,
      timestamp: Date.now(),
      isSensorVerified,
      isVoiceTriggered: true,
    });
  };

  return (
    <div id="module-handsfree-capture" className="min-h-[85vh] bg-stone-950 text-stone-100 p-4 max-w-md mx-auto flex flex-col justify-between">
      {/* Module Title Banner */}
      <div className="text-center mb-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-medium mb-1">
          <Smartphone className="w-3.5 h-3.5" />
          <span>Module 1: Voice & Sensor Capture</span>
        </div>
        <h2 className="text-xl font-serif font-bold text-amber-100">Hands-Free 3D Mirror</h2>
        <p className="text-xs text-stone-400">Eliminates "The 6-Foot Problem" with 90° sensor lock & voice trigger.</p>
      </div>

      {/* 90-Degree Accelerometer Alignment Meter */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-3.5 mb-3 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isSensorVerified ? 'bg-emerald-400 animate-ping' : 'bg-amber-500'}`} />
            <span className="text-xs font-semibold tracking-wider uppercase text-stone-300">
              Vertical Gyroscope Check
            </span>
          </div>
          <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
            isSensorVerified ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
          }`}>
            Pitch: {pitchAngle}° / 90.0°
          </span>
        </div>

        {/* Visual Spirit Level Gauge */}
        <div className="relative h-6 bg-stone-950 rounded-full border border-stone-700 overflow-hidden flex items-center px-1 mb-2">
          {/* Target 90° Corridor */}
          <div className="absolute left-[45%] right-[45%] top-0 bottom-0 bg-emerald-500/30 border-x border-emerald-400 z-0" />
          
          {/* Moving Indicator */}
          <div
            className={`relative z-10 w-4 h-4 rounded-full transition-all duration-300 shadow-md ${
              isSensorVerified ? 'bg-emerald-400 ring-4 ring-emerald-500/50' : 'bg-amber-400'
            }`}
            style={{ left: `${Math.min(Math.max(((pitchAngle - 70) / 40) * 100, 2), 94)}%` }}
          />
        </div>

        {/* Sensor Simulation Slider for iFrame testing */}
        <div className="flex items-center justify-between gap-2 text-[11px] text-stone-400">
          <span>Manual Sensor Alignment:</span>
          <input
            id="sensor-pitch-slider"
            type="range"
            min="70"
            max="110"
            step="0.5"
            value={pitchAngle}
            onChange={(e) => setPitchAngle(parseFloat(e.target.value))}
            className="w-28 accent-amber-500 cursor-pointer"
          />
          <button
            id="btn-calibrate-90"
            onClick={() => setPitchAngle(90)}
            className="text-amber-400 hover:underline font-mono text-[10px]"
          >
            Lock 90°
          </button>
        </div>
      </div>

      {/* Main Camera Viewfinder & Blur Lock overlay */}
      <div className="relative rounded-2xl overflow-hidden border border-stone-800 bg-stone-900 aspect-[3/4] flex flex-col justify-between p-4 shadow-2xl">
        {/* Unlocks only when 90° alignment reached */}
        {!isSensorVerified && (
          <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 mb-3 animate-bounce">
              <Smartphone className="w-6 h-6 rotate-90" />
            </div>
            <h3 className="text-base font-serif font-bold text-amber-200 mb-1">
              Prop Phone Vertically
            </h3>
            <p className="text-xs text-stone-300 max-w-xs mb-4">
              To ensure 100% accurate photogrammetry measurements, tilt phone until pitch reaches 90° (±3°).
            </p>
            <button
              id="btn-unlock-sensor"
              onClick={() => setPitchAngle(90)}
              className="px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-all shadow-lg"
            >
              Align to 90° Automatically
            </button>
          </div>
        )}

        {/* Background Preview (Live Webcam or Captured Profile Preview) */}
        <div className="absolute inset-0 bg-stone-900 z-0 flex items-center justify-center">
          {webcamActive ? (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          ) : captureStep === 'side' ? (
            <img src={sidePhoto || ''} alt="Side profile preview" className="w-full h-full object-cover opacity-80" referrerPolicy="no-referrer" />
          ) : (
            <img src={frontPhoto || ''} alt="Front profile preview" className="w-full h-full object-cover opacity-80" referrerPolicy="no-referrer" />
          )}

          {/* Grid Overlay for 3D Mesh Extraction */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        </div>

        {/* Top Floating Status Badges */}
        <div className="relative z-10 flex items-center justify-between">
          <span className="px-3 py-1 rounded-full bg-stone-950/80 border border-stone-700 text-[11px] font-mono text-amber-300 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {captureStep === 'front' ? 'FRONT PROFILE' : captureStep === 'side' ? 'SIDE PROFILE' : 'CAPTURED'}
          </span>

          <button
            id="btn-toggle-webcam"
            onClick={enableWebcam}
            className="px-2.5 py-1 rounded-full bg-stone-900/80 hover:bg-stone-800 border border-stone-700 text-[10px] text-stone-300 flex items-center gap-1"
          >
            <Camera className="w-3 h-3" />
            {webcamActive ? 'Webcam Active' : 'Use Camera'}
          </button>
        </div>

        {/* VUI Voice Agent Banner */}
        <div className="relative z-10 bg-stone-950/85 border border-stone-800 rounded-xl p-3 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2.5 h-2.5 rounded-full ${isListening ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
            <span className="text-[11px] font-semibold tracking-wider text-amber-300 uppercase flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5" /> Voice Assistant
            </span>
          </div>
          <p className="text-xs text-stone-200 font-sans leading-snug">
            "{voiceInstruction}"
          </p>
        </div>

        {/* Shutter Action & Controls - Strictly Minimalist */}
        <div className="relative z-10 flex items-center justify-between pt-2 gap-2">
          {/* File Upload Alternative */}
          <label className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-white cursor-pointer shadow flex items-center gap-1 text-xs">
            <Upload className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Upload</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e, captureStep === 'side' ? 'side' : 'front')}
            />
          </label>

          {/* Voice 'Snap' Shutter Button */}
          <button
            id="btn-voice-snap"
            onClick={startVoiceListener}
            disabled={!isSensorVerified}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs transition-all shadow-xl transform active:scale-95 ${
              isListening
                ? 'bg-amber-400 text-stone-950 ring-4 ring-amber-500/50 animate-pulse'
                : 'bg-gradient-to-r from-amber-500 to-amber-400 text-stone-950 hover:from-amber-400 hover:to-amber-300'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>{isListening ? "Listening..." : "Say 'Snap' or Tap"}</span>
          </button>
        </div>
      </div>

      {/* Height Slider Input */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-3.5 my-3 shadow-md">
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="height-cm-slider" className="text-xs font-semibold text-stone-300">
            User Height Calibration:
          </label>
          <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
            {heightCm} cm
          </span>
        </div>
        <input
          id="height-cm-slider"
          type="range"
          min="150"
          max="195"
          value={heightCm}
          onChange={(e) => setHeightCm(parseInt(e.target.value))}
          className="w-full accent-amber-500 cursor-pointer"
        />
      </div>

      {/* Primary Call to Action -> Sizing Engine */}
      <button
        id="btn-proceed-sizing"
        onClick={handleProceedToSizing}
        className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2"
      >
        <span>Generate 3D Sizing & Mesh</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
