const boostCache = new Map<string, number>();

const TARGET_FILL = 0.58;
const MIN_FILL = 0.02;
const MAX_BOOST = 2.75;

function measureOpaqueBounds(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): { contentW: number; contentH: number } | null {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha <= 16) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < minX || maxY < minY) return null;

  return {
    contentW: maxX - minX + 1,
    contentH: maxY - minY + 1,
  };
}

export function measurePartnerLogoBoost(img: HTMLImageElement): number {
  const src = img.currentSrc || img.src;
  const cached = boostCache.get(src);
  if (cached !== undefined) return cached;

  const naturalWidth = img.naturalWidth;
  const naturalHeight = img.naturalHeight;
  if (!src || !naturalWidth || !naturalHeight) return 1;
  if (src.toLowerCase().includes('.svg')) return 1;

  const sampleMax = 220;
  const sampleScale = Math.min(sampleMax / naturalWidth, sampleMax / naturalHeight, 1);
  const width = Math.max(1, Math.round(naturalWidth * sampleScale));
  const height = Math.max(1, Math.round(naturalHeight * sampleScale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return 1;

  try {
    ctx.drawImage(img, 0, 0, width, height);
    const bounds = measureOpaqueBounds(ctx.getImageData(0, 0, width, height).data, width, height);
    if (!bounds) {
      boostCache.set(src, 1);
      return 1;
    }

    const fillRatio = (bounds.contentW * bounds.contentH) / (width * height);
    const boost = Math.min(
      MAX_BOOST,
      Math.max(1, Math.sqrt(TARGET_FILL / Math.max(fillRatio, MIN_FILL))),
    );

    boostCache.set(src, boost);
    return boost;
  } catch {
    return 1;
  }
}
