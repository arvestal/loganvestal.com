const fs = require('fs');
const os = require('os');
const path = require('path');
const sharp = require('sharp');

const { processUpload } = require('../../src/lib/artwork-upload');

describe('processUpload', () => {
  let dataDir;

  beforeEach(() => {
    dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'artwork-upload-'));
  });

  it('writes a full and thumb WebP, downscaling the thumb but not enlarging the full image', async () => {
    const input = await sharp({
      create: {
        width: 600, height: 400, channels: 3, background: { r: 200, g: 50, b: 50 },
      },
    }).jpeg().toBuffer();

    await processUpload(input, dataDir, 'art-test');

    const fullMeta = await sharp(path.join(dataDir, 'full/art-test.webp')).metadata();
    const thumbMeta = await sharp(path.join(dataDir, 'thumb/art-test.webp')).metadata();

    expect(fullMeta.format).toBe('webp');
    expect(fullMeta.width).toBe(600);
    expect(fullMeta.height).toBe(400);

    expect(thumbMeta.format).toBe('webp');
    expect(thumbMeta.width).toBe(480);
    expect(thumbMeta.height).toBe(320);
  });

  it('visibly alters pixel data by compositing a watermark over the image', async () => {
    const input = await sharp({
      create: {
        width: 600, height: 400, channels: 3, background: { r: 10, g: 10, b: 10 },
      },
    }).jpeg().toBuffer();

    await processUpload(input, dataDir, 'art-watermark');

    const { data, info } = await sharp(path.join(dataDir, 'full/art-watermark.webp'))
      .raw()
      .toBuffer({ resolveWithObject: true });

    // A flat dark-gray source image with no watermark would be near-uniform; the tiled
    // watermark text/stroke should push at least some pixels away from the background color.
    let differing = 0;
    for (let i = 0; i < data.length; i += info.channels) {
      if (Math.abs(data[i] - 10) > 5) differing += 1;
    }
    expect(differing).toBeGreaterThan(0);
  });

  it('rejects when the buffer is not a decodable image', async () => {
    await expect(processUpload(Buffer.from('not an image'), dataDir, 'art-bad')).rejects.toThrow();
  });
});
