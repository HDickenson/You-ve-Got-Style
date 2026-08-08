/**
 * What the customer is shopping for, not who they are — a gift buyer and a
 * customer shopping their own wardrobe ask the same question. Everything
 * that grades, filters or writes guardrail copy forks on this, so it is
 * asked before capture and stays changeable from the menu, never a one-time
 * gate baked into onboarding.
 */
export type Wardrobe = 'womenswear' | 'menswear';

interface MeasurementsBase {
  heightCm: number;
  confidenceScore: number;
  meshPoints?: Array<{ id: string; x: number; y: number; z: number; label: string }>;
}

/** Bust, waist and hip circumference carry the fit. */
export interface WomenswearMeasurements extends MeasurementsBase {
  wardrobe: 'womenswear';
  chestCm: number;
  waistCm: number;
  hipsCm: number;
  inseamCm: number;
}

/** Chest, waist, neck and sleeve carry the fit; hips are not a menswear cutting reference. */
export interface MenswearMeasurements extends MeasurementsBase {
  wardrobe: 'menswear';
  chestCm: number;
  waistCm: number;
  neckCm: number;
  sleeveCm: number;
  inseamCm: number;
}

/**
 * A real fork, not a womenswear shape with optional menswear fields bolted
 * on — the two wardrobes grade on different measurements entirely, so a
 * consumer that needs to be wardrobe-aware narrows on `wardrobe` rather than
 * reading a field that may not exist for the customer in front of it.
 */
export type UserMeasurements = WomenswearMeasurements | MenswearMeasurements;

export interface BrandSizeMapping {
  brandName: string;
  recommendedSize: string;
  fitsToType: 'True to size' | 'Slightly tailored' | 'Relaxed fit' | 'Structured';
  fitDescription: string;
}

/**
 * Womenswear's hard guardrails. Kept as the shape every existing consumer
 * (StyleGuardrails, SwipeDiscovery, HeaderNav) already reads — not unioned
 * with `MenswearStyleConstraints` below, because that would force every one
 * of those files to narrow on `wardrobe` before it is their turn to pick up
 * the menswear guardrail copy (Mira, follow-on to this fork).
 */
export interface StyleConstraints {
  wardrobe: 'womenswear';
  modestWear: boolean;
  sleevesBelowElbow: boolean;
  noTrousers: boolean;
  hemlineBelowKnee: boolean;
  noNeonColors: boolean;
  noLoudPrints: boolean;
  preferredFabrics: string[];
  maxPriceAED?: number;
}

/**
 * Menswear's hard guardrails — a real fork, not "womenswear with the skirts
 * removed". Key names only; the label copy for each (equally specific,
 * matching the care the womenswear labels already show) is Mira's follow-on,
 * coordinated against these names rather than guessed independently.
 */
export interface MenswearStyleConstraints {
  wardrobe: 'menswear';
  modestWear: boolean;
  sleevesBelowElbow: boolean;
  /** No sleeveless or tank silhouettes. */
  coveredShoulders: boolean;
  /** The menswear equivalent of `hemlineBelowKnee` — trouser or thobe/kandura length, not a hemline. */
  kneesCovered: boolean;
  noShorts: boolean;
  /** Loose through the body rather than fitted — the menswear equivalent of a silhouette rule. */
  relaxedSilhouette: boolean;
  /** Thobe and kandura count as formalwear in their own right, not a costume substitute for Western tailoring. */
  traditionalFormalwearEligible: boolean;
  noNeonColors: boolean;
  noLoudPrints: boolean;
  preferredFabrics: string[];
  maxPriceAED?: number;
}

/** Not yet consumed anywhere — the type both forks share once a caller is ready to be wardrobe-aware. */
export type WardrobeStyleConstraints = StyleConstraints | MenswearStyleConstraints;

export type Hemline = 'mini' | 'knee' | 'midi' | 'maxi' | 'floor';
export type SleeveLength = 'sleeveless' | 'short' | 'elbow' | 'three-quarter' | 'long';
export type Neckline =
  | 'high'
  | 'crew'
  | 'scoop'
  | 'v-neck'
  | 'plunge'
  | 'off-shoulder'
  | 'halter'
  | 'strapless';
export type Opacity = 'opaque' | 'semi-sheer' | 'sheer';
export type BottomCategory = 'trousers' | 'skirt' | 'dress' | 'jumpsuit';
export type PatternType = 'solid' | 'textured' | 'printed';

/**
 * What a guardrail actually needs to know about a garment, as discrete facts
 * rather than prose to infer them from. "Does this cover the knee" is
 * answered by reading `hemline` — never by scanning `bottom_garment` for the
 * word "mini". Every `FashionLook`, whichever source composed it, carries
 * these; a source that cannot state them is not a source guardrails can run
 * against.
 */
export interface GarmentAttributes {
  hemline: Hemline;
  sleeveLength: SleeveLength;
  neckline: Neckline;
  opacity: Opacity;
  bottomCategory: BottomCategory;
  pattern: PatternType;
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
  attributes: GarmentAttributes;
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
