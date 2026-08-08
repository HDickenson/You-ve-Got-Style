import {
  BrandSizeMapping,
  MenswearMeasurements,
  UserMeasurements,
  Wardrobe,
  WomenswearMeasurements,
} from '../types';

export const GCC_LUXURY_BRANDS = [
  {
    name: 'Chanel',
    country: 'France',
    fitType: 'Slightly tailored' as const,
    sizeTable: [
      { size: 'FR 34 (US 2)', chest: [80, 84], waist: [60, 64], hips: [86, 90] },
      { size: 'FR 36 (US 4)', chest: [85, 88], waist: [65, 68], hips: [91, 94] },
      { size: 'FR 38 (US 6)', chest: [89, 92], waist: [69, 72], hips: [95, 98] },
      { size: 'FR 40 (US 8)', chest: [93, 97], waist: [73, 77], hips: [99, 103] },
      { size: 'FR 42 (US 10)', chest: [98, 102], waist: [78, 82], hips: [104, 108] },
    ]
  },
  {
    name: 'Zimmermann',
    country: 'Australia / GCC',
    fitType: 'True to size' as const,
    sizeTable: [
      { size: 'Size 0 (US 2-4)', chest: [81, 85], waist: [62, 66], hips: [88, 92] },
      { size: 'Size 1 (US 6)', chest: [86, 90], waist: [67, 71], hips: [93, 97] },
      { size: 'Size 2 (US 8)', chest: [91, 95], waist: [72, 76], hips: [98, 102] },
      { size: 'Size 3 (US 10)', chest: [96, 100], waist: [77, 81], hips: [103, 107] },
    ]
  },
  {
    name: 'Loro Piana',
    country: 'Italy',
    fitType: 'Relaxed fit' as const,
    sizeTable: [
      { size: 'IT 38 (US 2)', chest: [80, 83], waist: [61, 64], hips: [87, 90] },
      { size: 'IT 40 (US 4)', chest: [84, 87], waist: [65, 68], hips: [91, 94] },
      { size: 'IT 42 (US 6)', chest: [88, 91], waist: [69, 72], hips: [95, 98] },
      { size: 'IT 44 (US 8)', chest: [92, 96], waist: [73, 77], hips: [99, 103] },
      { size: 'IT 46 (US 10)', chest: [97, 101], waist: [78, 82], hips: [104, 108] },
    ]
  },
  {
    name: 'Khaite',
    country: 'USA / Paris',
    fitType: 'Structured' as const,
    sizeTable: [
      { size: 'US 2 / XS', chest: [81, 84], waist: [61, 64], hips: [86, 89] },
      { size: 'US 4 / S', chest: [85, 88], waist: [65, 68], hips: [90, 93] },
      { size: 'US 6 / M', chest: [89, 92], waist: [69, 72], hips: [94, 97] },
      { size: 'US 8 / L', chest: [93, 97], waist: [73, 77], hips: [98, 102] },
    ]
  },
  {
    name: 'Brunello Cucinelli',
    country: 'Italy',
    fitType: 'Structured' as const,
    sizeTable: [
      { size: 'IT 38 (S)', chest: [82, 85], waist: [63, 66], hips: [88, 91] },
      { size: 'IT 40 (M)', chest: [86, 89], waist: [67, 70], hips: [92, 95] },
      { size: 'IT 42 (L)', chest: [90, 94], waist: [71, 75], hips: [96, 100] },
    ]
  },
  {
    name: 'Massimo Dutti Limited',
    country: 'Spain / GCC',
    fitType: 'True to size' as const,
    sizeTable: [
      { size: 'EUR 34 / XS', chest: [80, 83], waist: [62, 65], hips: [88, 91] },
      { size: 'EUR 36 / S', chest: [84, 87], waist: [66, 69], hips: [92, 95] },
      { size: 'EUR 38 / M', chest: [88, 91], waist: [70, 73], hips: [96, 99] },
      { size: 'EUR 40 / L', chest: [92, 96], waist: [74, 78], hips: [100, 104] },
    ]
  }
];

/**
 * A different table, not the womenswear one relabelled — menswear grades
 * against chest, waist and neck, and the three houses that carry both lines
 * (Cucinelli, Loro Piana, the Zegna/Massimo Dutti crossover) cut men in
 * IT/EUR 46-56, an entirely different number range from the FR/IT 34-44
 * above.
 */
export const GCC_LUXURY_BRANDS_MENSWEAR = [
  {
    name: 'Brunello Cucinelli',
    country: 'Italy',
    fitType: 'Structured' as const,
    sizeTable: [
      { size: 'IT 46 (S)', chest: [88, 92], waist: [76, 80], neck: [37, 38] },
      { size: 'IT 48 (M)', chest: [93, 97], waist: [81, 85], neck: [39, 40] },
      { size: 'IT 50 (L)', chest: [98, 102], waist: [86, 90], neck: [41, 42] },
      { size: 'IT 52 (XL)', chest: [103, 107], waist: [91, 95], neck: [43, 44] },
      { size: 'IT 54 (XXL)', chest: [108, 112], waist: [96, 100], neck: [45, 46] },
    ]
  },
  {
    name: 'Loro Piana',
    country: 'Italy',
    fitType: 'Relaxed fit' as const,
    sizeTable: [
      { size: 'IT 46 (S)', chest: [89, 93], waist: [77, 81], neck: [37, 38] },
      { size: 'IT 48 (M)', chest: [94, 98], waist: [82, 86], neck: [39, 40] },
      { size: 'IT 50 (L)', chest: [99, 103], waist: [87, 91], neck: [41, 42] },
      { size: 'IT 52 (XL)', chest: [104, 108], waist: [92, 96], neck: [43, 44] },
      { size: 'IT 54 (XXL)', chest: [109, 113], waist: [97, 101], neck: [45, 46] },
      { size: 'IT 56 (3XL)', chest: [114, 118], waist: [102, 106], neck: [47, 48] },
    ]
  },
  {
    name: 'Zegna',
    country: 'Italy',
    fitType: 'True to size' as const,
    sizeTable: [
      { size: 'IT 46 (S)', chest: [88, 91], waist: [75, 79], neck: [36, 37] },
      { size: 'IT 48 (M)', chest: [92, 96], waist: [80, 84], neck: [38, 39] },
      { size: 'IT 50 (L)', chest: [97, 101], waist: [85, 89], neck: [40, 41] },
      { size: 'IT 52 (XL)', chest: [102, 106], waist: [90, 94], neck: [42, 43] },
      { size: 'IT 54 (XXL)', chest: [107, 111], waist: [95, 99], neck: [44, 45] },
    ]
  },
  {
    name: 'Massimo Dutti Limited',
    country: 'Spain / GCC',
    fitType: 'True to size' as const,
    sizeTable: [
      { size: 'EUR 46 / S', chest: [88, 92], waist: [76, 80], neck: [37, 38] },
      { size: 'EUR 48 / M', chest: [93, 97], waist: [81, 85], neck: [39, 40] },
      { size: 'EUR 50 / L', chest: [98, 102], waist: [86, 90], neck: [41, 42] },
      { size: 'EUR 52 / XL', chest: [103, 107], waist: [91, 95], neck: [43, 44] },
    ]
  }
];

function womenswearProportions(heightCm: number): WomenswearMeasurements {
  // Fixed reference proportions scaled by height ratio — a starting point,
  // not a measurement of anyone. Nothing here scans or triangulates a real
  // body; these constants are estimates, and the copy that surfaces this
  // data says so.
  const heightRatio = heightCm / 170;

  const chestCm = Math.round(88 * heightRatio);
  const waistCm = Math.round(68 * heightRatio);
  const hipsCm = Math.round(95 * heightRatio);
  const inseamCm = Math.round(heightCm * 0.46);

  return {
    wardrobe: 'womenswear',
    heightCm,
    chestCm,
    waistCm,
    hipsCm,
    inseamCm,
  };
}

/**
 * Same height-ratio formula shape as the womenswear fork, against male
 * anthropometric reference values instead — chest, waist, neck and sleeve,
 * no hip circumference. This is still a height-only estimate, the same known
 * weakness the womenswear formula has; forking it does not make it more
 * precise than it is.
 */
function menswearProportions(heightCm: number): MenswearMeasurements {
  const heightRatio = heightCm / 170;

  const chestCm = Math.round(96 * heightRatio);
  const waistCm = Math.round(80 * heightRatio);
  const neckCm = Math.round(38 * heightRatio);
  const sleeveCm = Math.round(63 * heightRatio);
  const inseamCm = Math.round(heightCm * 0.46);

  return {
    wardrobe: 'menswear',
    heightCm,
    chestCm,
    waistCm,
    neckCm,
    sleeveCm,
    inseamCm,
  };
}

export function estimateMeasurementsFromHeight(heightCm: number): WomenswearMeasurements;
export function estimateMeasurementsFromHeight(heightCm: number, wardrobe: 'menswear'): MenswearMeasurements;
export function estimateMeasurementsFromHeight(heightCm: number, wardrobe: 'womenswear'): WomenswearMeasurements;
export function estimateMeasurementsFromHeight(heightCm: number, wardrobe: Wardrobe): UserMeasurements;
export function estimateMeasurementsFromHeight(
  heightCm: number,
  wardrobe: Wardrobe = 'womenswear',
): UserMeasurements {
  return wardrobe === 'menswear' ? menswearProportions(heightCm) : womenswearProportions(heightCm);
}

/** Closest chest/waist match within one brand's table. The matcher generalises across wardrobes; only the tables and fields underneath it fork. */
function nearestSize(
  sizeTable: ReadonlyArray<{ size: string; chest: number[]; waist: number[] }>,
  chestCm: number,
  waistCm: number,
): string {
  let matchedSize = sizeTable[1].size; // default fallback
  let bestDiff = 999;

  for (const entry of sizeTable) {
    const chestAvg = (entry.chest[0] + entry.chest[1]) / 2;
    const waistAvg = (entry.waist[0] + entry.waist[1]) / 2;
    const diff = Math.abs(chestCm - chestAvg) + Math.abs(waistCm - waistAvg);

    if (diff < bestDiff) {
      bestDiff = diff;
      matchedSize = entry.size;
    }
  }

  return matchedSize;
}

export function mapMeasurementsToBrandSizes(measurements: UserMeasurements): BrandSizeMapping[] {
  if (measurements.wardrobe === 'menswear') {
    return GCC_LUXURY_BRANDS_MENSWEAR.map(brand => ({
      brandName: brand.name,
      recommendedSize: nearestSize(brand.sizeTable, measurements.chestCm, measurements.waistCm),
      fitsToType: brand.fitType,
      fitDescription: `Optimal drape based on ${measurements.chestCm}cm chest & ${measurements.waistCm}cm waist.`
    }));
  }

  return GCC_LUXURY_BRANDS.map(brand => ({
    brandName: brand.name,
    recommendedSize: nearestSize(brand.sizeTable, measurements.chestCm, measurements.waistCm),
    fitsToType: brand.fitType,
    fitDescription: `Optimal drape based on ${measurements.chestCm}cm bust & ${measurements.waistCm}cm waist.`
  }));
}
