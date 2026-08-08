/**
 * What the customer is shopping for, not who they are — a gift buyer and a
 * customer shopping their own wardrobe ask the same question. Everything
 * that grades, filters or writes guardrail copy forks on this, so it is
 * asked before capture and stays changeable from the menu, never a one-time
 * gate baked into onboarding.
 */
export type Wardrobe = 'womenswear' | 'menswear';

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
  /** Set when try-on generation was attempted and failed, so the UI can say so instead of passing the placeholder off as a real render. */
  imageGenerationFailed?: boolean;
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

export type AppPhase = 'wardrobe' | 'onboarding' | 'sizing' | 'guardrails' | 'discovery' | 'capsule';

export interface CheckoutItem {
  look: FashionLook;
  selectedBrandSize: { [brandName: string]: string };
  totalAED: number;
}
