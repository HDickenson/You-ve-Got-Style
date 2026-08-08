import { FashionLook } from '../types';

/**
 * A 4:5 sand plate at 800×1000, served locally. It stands in until a look has
 * an image of its own — nothing borrowed from a third party, and it reserves
 * its own space rather than reflowing the card when it lands.
 */
export const LOOK_PLACEHOLDER = '/look-placeholder.svg';

/**
 * Everything about a look the app composes for you except the words: house,
 * price, cloth, swatches. It lives here rather than in the shell because a
 * colour swatch is garment colour — real dye on real silk — and no brand token
 * can stand in for it. The shell holds no hex.
 */
export const COMPOSED_LOOK_TEMPLATE: Pick<
  FashionLook,
  | 'brand'
  | 'priceUSD'
  | 'priceAED'
  | 'fabric'
  | 'colorPalette'
  | 'imageUrl'
  | 'tags'
> = {
  brand: 'Atelier Édition',
  priceUSD: 2300,
  priceAED: 8440,
  fabric: 'Mulberry Silk & Italian Cashmere',
  colorPalette: ['#E6D0AC', '#1A2B4C', '#F7F5F0'],
  imageUrl: LOOK_PLACEHOLDER,
  tags: ['Made for you', 'Modest Wear', 'Custom Fitting'],
};

export const INITIAL_LOOKS: FashionLook[] = [
  {
    id: 'look-1',
    look_title: 'Executive Boardroom Elegance',
    occasion: 'Board Meeting',
    top_garment: 'Tailored Ivory Silk Crepe Blouse with High Stand Collar & Cuffed Long Sleeves',
    bottom_garment: 'Structured Navy Wool-Crepe Wide-Leg Trousers with High Waist',
    compliance_check: true,
    capsule_synergy: 'Blouse pairs seamlessly with camel pencil skirts or cashmere cardigans. Trousers match white linen blazers for casual meetings.',
    brand: 'Chanel',
    priceUSD: 1850,
    priceAED: 6790,
    fabric: '100% Mulberry Silk Crepe & Italian Virgin Wool',
    colorPalette: ['#F7F5F0', '#1A2B4C', '#D4AF37'],
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1000&q=80',
    tags: ['Modest Wear', 'Structured', 'Business Professional', 'Sleeves Below Elbow'],
    brand_sizes: [
      { brandName: 'Chanel', recommendedSize: 'FR 38 (US 6)', fitsToType: 'Slightly tailored', fitDescription: 'Precision shoulder alignment' },
      { brandName: 'Loro Piana', recommendedSize: 'IT 42 (US 6)', fitsToType: 'Relaxed fit', fitDescription: 'Fluid drape through waist' },
      { brandName: 'Khaite', recommendedSize: 'US 6 / M', fitsToType: 'Structured', fitDescription: 'Snug high-waist trim' },
      { brandName: 'Massimo Dutti', recommendedSize: 'EUR 38 / M', fitsToType: 'True to size', fitDescription: 'Standard luxury tailoring' }
    ]
  },
  {
    id: 'look-2',
    look_title: 'Dubai Networking Soirée',
    occasion: 'Networking Dinner',
    top_garment: 'Emerald Green Draped Silk Tunic Top with Long Modest Cuffed Sleeves',
    bottom_garment: 'Pleated Ankle-Length Silk Column Skirt in Deep Emerald',
    compliance_check: true,
    capsule_synergy: 'Top pairs effortlessly with black tailored trousers. Column skirt mixes with cream knit sweaters.',
    brand: 'Zimmermann',
    priceUSD: 2100,
    priceAED: 7710,
    fabric: 'Heavyweight Charmeuse Silk',
    colorPalette: ['#0A4D3C', '#062B21', '#E2C044'],
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80',
    tags: ['Modest Wear', 'Silk', 'Evening', 'No Trousers Friendly'],
    brand_sizes: [
      { brandName: 'Zimmermann', recommendedSize: 'Size 1 (US 6)', fitsToType: 'True to size', fitDescription: 'Flowing silhouette with cinched cuffs' },
      { brandName: 'Chanel', recommendedSize: 'FR 38 (US 6)', fitsToType: 'Slightly tailored', fitDescription: 'Comfortable bust clearance' },
      { brandName: 'Brunello Cucinelli', recommendedSize: 'IT 40 (M)', fitsToType: 'Structured', fitDescription: 'Elegant sleeve drop' }
    ]
  },
  {
    id: 'look-3',
    look_title: 'Jumeirah Weekend Brunch',
    occasion: 'Weekend Brunch',
    top_garment: 'Oversized Sand Cashmere Knit Sweater with Modest Mock Neck',
    bottom_garment: 'Flowing Off-White Linen-Silk Maxi Skirt with Concealed Pockets',
    compliance_check: true,
    capsule_synergy: 'Sand sweater coordinates with denim or tailored shorts on coastal trips. Maxi skirt pairs with cropped linen shirts.',
    brand: 'Loro Piana',
    priceUSD: 2450,
    priceAED: 8990,
    fabric: 'Baby Cashmere & Pure Raw Linen',
    colorPalette: ['#E6D7C3', '#F9F8F6', '#8C7A6B'],
    imageUrl: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1000&q=80',
    tags: ['Cashmere', 'Modest Wear', 'Smart Casual', 'Neutral Tones'],
    brand_sizes: [
      { brandName: 'Loro Piana', recommendedSize: 'IT 40 (US 4)', fitsToType: 'Relaxed fit', fitDescription: 'Ultra-soft relaxed fit' },
      { brandName: 'Massimo Dutti', recommendedSize: 'EUR 36 / S', fitsToType: 'True to size', fitDescription: 'Gentle waist drape' },
      { brandName: 'Khaite', recommendedSize: 'US 4 / S', fitsToType: 'Structured', fitDescription: 'Refined neckline framing' }
    ]
  },
  {
    id: 'look-4',
    look_title: 'Alserkal Avenue Art Vernissage',
    occasion: 'Art Gallery Opening',
    top_garment: 'Architectural Charcoal Wool Tunic Coat with Bracelet Sleeves',
    bottom_garment: 'Black Tailored Tapered Trousers with Ankle Slit Detail',
    compliance_check: true,
    capsule_synergy: 'Tunic coat serves as a lightweight duster over slip dresses. Trousers act as a staple foundation for any capsule outfit.',
    brand: 'Khaite',
    priceUSD: 1980,
    priceAED: 7270,
    fabric: 'Structured Double-Faced Virgin Wool',
    colorPalette: ['#2F3136', '#121212', '#999999'],
    imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1000&q=80',
    tags: ['Architectural', 'Minimalist', 'Modest', 'Monochrome'],
    brand_sizes: [
      { brandName: 'Khaite', recommendedSize: 'US 6 / M', fitsToType: 'Structured', fitDescription: 'Precision shoulder sculpting' },
      { brandName: 'Chanel', recommendedSize: 'FR 38 (US 6)', fitsToType: 'Slightly tailored', fitDescription: 'Clean chest line' }
    ]
  },
  {
    id: 'look-5',
    look_title: 'Royal Gala & Cultural Reception',
    occasion: 'Galas & Events',
    top_garment: 'Champagne Satin Floor-Length Kaftan-Cape Dress with Embroidered Gold Cuffs',
    bottom_garment: 'Integrated Full-Length Satin Slip Underlayer',
    compliance_check: true,
    capsule_synergy: 'Full modest silhouette requiring no additional layering. Pairs with emerald jewel tone accessories.',
    brand: 'Brunello Cucinelli',
    priceUSD: 3600,
    priceAED: 13200,
    fabric: 'Heavy Satin Silk & Metallic Thread Detailing',
    colorPalette: ['#E6D0AC', '#FAF8F5', '#C5A059'],
    imageUrl: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1000&q=80',
    tags: ['Royal Gala', 'Modest Wear', 'Satin', 'Gold Accents'],
    brand_sizes: [
      { brandName: 'Brunello Cucinelli', recommendedSize: 'IT 40 (M)', fitsToType: 'Structured', fitDescription: 'Majestic floor-length drape' },
      { brandName: 'Zimmermann', recommendedSize: 'Size 1 (US 6)', fitsToType: 'True to size', fitDescription: 'Perfect sleeve length drop' }
    ]
  }
];
