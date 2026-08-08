export interface UserMeasurements {
  heightCm: number;
  chestCm: number;
  waistCm: number;
  hipsCm: number;
  inseamCm: number;
  confidenceScore: number;
  meshPoints?: Array<{ id: string; x: number; y: number; z: number; label: string }>;
}

export interface BrandSizeMapping {
  brandName: string;
  recommendedSize: string;
  fitsToType: 'True to size' | 'Slightly tailored' | 'Relaxed fit' | 'Structured';
  fitDescription: string;
}

export interface StyleConstraints {
  modestWear: boolean;
  sleevesBelowElbow: boolean;
  noTrousers: boolean;
  hemlineBelowKnee: boolean;
  noNeonColors: boolean;
  noLoudPrints: boolean;
  preferredFabrics: string[];
  preferredAesthetics: string[];
  maxPriceAED?: number;
}

export interface FashionLook {
  id: string;
  look_title: string;
  occasion: string;
  top_garment: string;
  bottom_garment: string;
  dress_garment?: string;
  compliance_check: boolean;
  capsule_synergy: string;
  brand_sizes: BrandSizeMapping[];
  imageUrl: string;
  priceUSD: number;
  priceAED: number;
  brand: string;
  fabric: string;
  colorPalette: string[];
  tags: string[];
}

export interface CapturedProfile {
  frontPhoto: string | null;
  sidePhoto: string | null;
  heightCm: number;
  timestamp: number;
  isSensorVerified: boolean;
  isVoiceTriggered: boolean;
}

export type AppPhase = 'onboarding' | 'sizing' | 'guardrails' | 'discovery' | 'capsule' | 'ai-features' | 'moodboard' | 'fit-analytics' | 'social-lookbook' | 'digital-closet';

export interface CheckoutItem {
  look: FashionLook;
  selectedBrandSize: { [brandName: string]: string };
  totalAED: number;
}

export interface MoodboardItem {
  id: string;
  sourceLookId: string;
  type: 'top' | 'bottom' | 'dress' | 'look';
  description: string;
  imageUrl: string;
  x: number;
  y: number;
  zIndex: number;
}

export interface ClosetItem {
  id: string;
  category: 'Tops' | 'Bottoms' | 'Outerwear' | 'Shoes' | 'Accessories' | 'Other';
  description: string;
  color: string;
  fabric?: string;
  imageUrl?: string;
}
