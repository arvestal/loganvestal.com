const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const FULL_MAX_PX = 2000;
const THUMB_WIDTH_PX = 480;
const WATERMARK_TEXT = 'LOGAN VESTAL';

// Tiled, rotated text watermark sized relative to the image so it reads the same on the full
// image and the thumb. Applied to both sizes (not just the full) since the thumb is a real,
// clickable/savable image in its own right on the gallery grid. The tile must be wider than the
// rendered text or adjacent repeats overlap into an illegible smear.
function watermarkSvg(width, height) {
  const fontSize = Math.max(14, Math.round(width / 28));
  const textWidth = WATERMARK_TEXT.length * fontSize * 0.6;
  const tileWidth = Math.round(textWidth * 1.8);
  const tileHeight = Math.round(tileWidth * 0.55);
  return Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="watermark" width="${tileWidth}" height="${tileHeight}" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
          <text x="0" y="${Math.round(tileHeight / 2)}" font-family="sans-serif" font-size="${fontSize}"
                font-weight="700" fill="rgba(255,255,255,0.3)" stroke="rgba(0,0,0,0.3)" stroke-width="1">${WATERMARK_TEXT}</text>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#watermark)"/>
    </svg>
  `);
}

async function resizeAndWatermark(image, resizeOptions, quality, outputFile) {
  const resized = await image.clone().resize(resizeOptions).toBuffer({ resolveWithObject: true });
  await sharp(resized.data)
    .composite([{ input: watermarkSvg(resized.info.width, resized.info.height), blend: 'over' }])
    .webp({ quality })
    .toFile(outputFile);
}

// Sharp/libvips only — this runs on Railway's Linux container at request time, so there's no
// shelling out to macOS-only tools. Some HEIC variants (multi-reference "portrait"/burst
// containers) will fail here; that's surfaced to the admin as an upload error asking them to
// export as JPEG instead, rather than failing silently.
async function processUpload(buffer, dataDir, slug) {
  const fullDir = path.join(dataDir, 'full');
  const thumbDir = path.join(dataDir, 'thumb');
  fs.mkdirSync(fullDir, { recursive: true });
  fs.mkdirSync(thumbDir, { recursive: true });

  const image = sharp(buffer).rotate();

  await resizeAndWatermark(
    image,
    { width: FULL_MAX_PX, height: FULL_MAX_PX, fit: 'inside', withoutEnlargement: true },
    82,
    path.join(fullDir, `${slug}.webp`),
  );

  await resizeAndWatermark(
    image,
    { width: THUMB_WIDTH_PX, withoutEnlargement: true },
    78,
    path.join(thumbDir, `${slug}.webp`),
  );
}

module.exports = { processUpload };
