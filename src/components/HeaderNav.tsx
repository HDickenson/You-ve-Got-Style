import React, { useState, useEffect } from 'react';
import { ShoppingBag, Menu, X, User, SlidersHorizontal, Camera, Activity, ShieldCheck, Sparkles, Check, LogIn, LogOut, LayoutDashboard, Package } from 'lucide-react';
import { AppPhase, StyleConstraints } from '../types';
import { auth, signIn, signOut } from '../firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface HeaderNavProps {
  currentPhase: AppPhase;
  setPhase: (phase: AppPhase) => void;
  savedCount: number;
  constraints: StyleConstraints;
  onOpenGuardrails: () => void;
  heightCm: number;
  onGenerateAiLook?: (occasion: string) => Promise<void>;
  isGeneratingAi?: boolean;
  onOpenInsights?: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentPhase,
  setPhase,
  savedCount,
  constraints,
  onOpenGuardrails,
  heightCm,
  onGenerateAiLook,
  isGeneratingAi,
  onOpenInsights,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const activeConstraintCount = [
    constraints.modestWear,
    constraints.sleevesBelowElbow,
    constraints.noTrousers,
    constraints.hemlineBelowKnee,
    constraints.noNeonColors,
    constraints.noLoudPrints,
  ].filter(Boolean).length;

  return (
    <>
      {/* Sophisticated Minimalist Top Bar: STRICTLY 1 ACTION BUTTON (Menu/Profile) */}
      <header id="app-header-nav" className="sticky top-0 z-40 bg-stone-950/95 backdrop-blur-md border-b border-stone-800/80 text-stone-100 px-4 py-3 transition-all">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {/* Action 1 (Left): Profile / Menu Trigger */}
          <button
            id="nav-btn-profile-menu"
            onClick={() => setIsMenuOpen(true)}
            className="p-2.5 rounded-full bg-stone-900 border border-stone-800 text-amber-100 hover:text-amber-300 hover:bg-stone-800 transition-all shadow-sm flex items-center gap-1.5"
            aria-label="Open Profile and Menu"
          >
            <Menu className="w-4 h-4" />
            <span className="text-[10px] font-mono tracking-wider uppercase text-amber-300 font-bold">Profile</span>
          </button>

          {/* Center: Wordmark Brand (Static, non-button) */}
          <div className="text-center">
            <h1 className="font-serif text-lg tracking-wider font-semibold text-amber-100">
              You've Got Style
            </h1>
            <p className="text-[9px] text-stone-500 font-mono uppercase tracking-widest -mt-0.5">
              GCC AI Stylist
            </p>
          </div>

          {/* Right: Minimalist Badge (Static, non-button) */}
          <div className="text-right">
            <span className="text-[10px] font-mono text-stone-400 bg-stone-900 border border-stone-800 px-2 py-1 rounded-full">
              {heightCm}cm
            </span>
          </div>
        </div>
      </header>

      {/* Mature Slide-Over Menu & Profile Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex justify-start transition-all animate-fadeIn">
          <div className="bg-stone-900 border-r border-stone-800 text-stone-100 w-full max-w-xs h-full p-5 flex flex-col justify-between shadow-2xl overflow-y-auto">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-stone-800 mb-6">
                <div className="flex items-center gap-2">
                  {user && user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-9 h-9 rounded-full shadow border border-amber-500/30" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-600 to-amber-200 flex items-center justify-center text-stone-950 font-serif font-bold text-sm shadow">
                      {user ? (user.displayName?.[0] || 'U') : 'YS'}
                    </div>
                  )}
                  <div>
                    <h2 className="font-serif font-bold text-base text-amber-100">{user ? user.displayName || 'Stylist Profile' : 'Stylist Profile'}</h2>
                    <p className="text-[10px] font-mono text-stone-400">{user ? user.email : 'GCC Luxury Suite'} • {heightCm}cm</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 rounded-full bg-stone-800 text-stone-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Menu Navigation Modules */}
              <div className="space-y-3 font-sans">
                <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 block mb-1">
                  Styling Engine Modules
                </span>

                {/* Module 1: Swipe Discovery */}
                <button
                  onClick={() => {
                    setPhase('discovery');
                    setIsMenuOpen(false);
                  }}
                  className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                    currentPhase === 'discovery'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-200 font-bold'
                      : 'bg-stone-950 border-stone-800 hover:border-stone-700 text-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-serif font-semibold">Swipe Discovery</span>
                  </div>
                  {currentPhase === 'discovery' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </button>

                {/* Module 2: Hands-Free Voice Capture */}
                <button
                  onClick={() => {
                    setPhase('onboarding');
                    setIsMenuOpen(false);
                  }}
                  className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                    currentPhase === 'onboarding'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-200 font-bold'
                      : 'bg-stone-950 border-stone-800 hover:border-stone-700 text-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Camera className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-serif font-semibold">Hands-Free 3D Mirror</span>
                  </div>
                  {currentPhase === 'onboarding' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </button>

                {/* Module 3: 3D Photogrammetry & Sizing */}
                <button
                  onClick={() => {
                    setPhase('sizing');
                    setIsMenuOpen(false);
                  }}
                  className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                    currentPhase === 'sizing'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-200 font-bold'
                      : 'bg-stone-950 border-stone-800 hover:border-stone-700 text-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Activity className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-serif font-semibold">Volumetric Sizing</span>
                  </div>
                  {currentPhase === 'sizing' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </button>

                {/* Capsule Wardrobe */}
                <button
                  onClick={() => {
                    setPhase('capsule');
                    setIsMenuOpen(false);
                  }}
                  className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                    currentPhase === 'capsule'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-200 font-bold'
                      : 'bg-stone-950 border-stone-800 hover:border-stone-700 text-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ShoppingBag className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-serif font-semibold">Capsule Wardrobe</span>
                  </div>
                  {savedCount > 0 ? (
                    <span className="bg-emerald-500 text-stone-950 font-bold text-[10px] font-mono px-2 py-0.5 rounded-full">
                      {savedCount} Saved
                    </span>
                  ) : (
                    currentPhase === 'capsule' && <Check className="w-3.5 h-3.5 text-amber-400" />
                  )}
                </button>

                {/* Moodboard */}
                <button
                  onClick={() => {
                    setPhase('moodboard');
                    setIsMenuOpen(false);
                  }}
                  className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                    currentPhase === 'moodboard'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-200 font-bold'
                      : 'bg-stone-950 border-stone-800 hover:border-stone-700 text-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-serif font-semibold">Moodboard</span>
                  </div>
                  {currentPhase === 'moodboard' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </button>

                {/* Fit Analytics */}
                <button
                  onClick={() => {
                    setPhase('fit-analytics');
                    setIsMenuOpen(false);
                  }}
                  className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                    currentPhase === 'fit-analytics'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-200 font-bold'
                      : 'bg-stone-950 border-stone-800 hover:border-stone-700 text-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Activity className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-serif font-semibold">Fit Analytics</span>
                  </div>
                  {currentPhase === 'fit-analytics' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </button>

                {/* Social Lookbook */}
                <button
                  onClick={() => {
                    setPhase('social-lookbook');
                    setIsMenuOpen(false);
                  }}
                  className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                    currentPhase === 'social-lookbook'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-200 font-bold'
                      : 'bg-stone-950 border-stone-800 hover:border-stone-700 text-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Camera className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-serif font-semibold">Social Lookbook</span>
                  </div>
                  {currentPhase === 'social-lookbook' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </button>

                {/* Digital Closet */}
                <button
                  onClick={() => {
                    setPhase('digital-closet');
                    setIsMenuOpen(false);
                  }}
                  className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                    currentPhase === 'digital-closet'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-200 font-bold'
                      : 'bg-stone-950 border-stone-800 hover:border-stone-700 text-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Package className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-serif font-semibold">Digital Closet</span>
                  </div>
                  {currentPhase === 'digital-closet' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </button>

                {/* AI Features */}
                <button
                  onClick={() => {
                    setPhase('ai-features');
                    setIsMenuOpen(false);
                  }}
                  className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                    currentPhase === 'ai-features'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-200 font-bold'
                      : 'bg-stone-950 border-stone-800 hover:border-stone-700 text-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-serif font-semibold">Gemini Intelligence</span>
                  </div>
                  {currentPhase === 'ai-features' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </button>

                {/* Gemini AI Look Synthesis Button */}
                {onGenerateAiLook && (
                  <button
                    onClick={async () => {
                      setIsMenuOpen(false);
                      setPhase('discovery');
                      await onGenerateAiLook('All Occasions');
                    }}
                    disabled={isGeneratingAi}
                    className="w-full p-3 rounded-xl border bg-gradient-to-r from-amber-500/20 to-amber-400/10 border-amber-500/40 text-amber-200 hover:border-amber-400 flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <Sparkles className={`w-4 h-4 text-amber-400 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                      <span className="text-xs font-serif font-bold text-amber-100">
                        {isGeneratingAi ? 'Synthesizing Look...' : 'Generate AI Custom Look'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-amber-300">Gemini 2.5</span>
                  </button>
                )}

                {/* Module 4: Style Like You Guardrails */}
                <button
                  onClick={() => {
                    onOpenGuardrails();
                    setIsMenuOpen(false);
                  }}
                  className="w-full p-3 rounded-xl border bg-stone-950 border-stone-800 hover:border-stone-700 text-stone-300 flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-serif font-semibold">"Style Like You" Filter</span>
                  </div>
                  <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded border border-amber-500/30">
                    {activeConstraintCount} Active
                  </span>
                </button>

                {/* Style Insights Modal */}
                {onOpenInsights && (
                  <button
                    onClick={() => {
                      onOpenInsights();
                      setIsMenuOpen(false);
                    }}
                    className="w-full p-3 rounded-xl border bg-stone-950 border-stone-800 hover:border-stone-700 text-stone-300 flex items-center justify-between transition-all mt-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-serif font-semibold">Daily Style Insight</span>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Footer Information */}
            <div className="pt-4 border-t border-stone-800 text-[10px] font-mono text-stone-500 space-y-3">
              {user ? (
                <button
                  onClick={() => signOut()}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded border border-stone-800 hover:bg-stone-800 text-stone-400 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <button
                  onClick={() => signIn()}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In with Google</span>
                </button>
              )}
              <div className="space-y-1">
                <p>Engine: Gemini 2.5 Flash + Photogrammetry</p>
                <p>Security: UAE PDPL On-Device Compliance</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

