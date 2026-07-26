const fs = require('fs');
const path = require('path');

// Railway mounts the persistent volume at /data in production (ARTWORK_DATA_DIR=/data/artwork).
// Locally this defaults to a gitignored folder so admin features work without a real volume.
function resolveDataDir() {
  return process.env.ARTWORK_DATA_DIR || path.join(__dirname, '../../.artwork-data');
}

function artworkFile(dataDir) {
  return path.join(dataDir, 'artwork.json');
}

// Returns [] if artwork.json doesn't exist yet (fresh volume, nothing uploaded).
function listArtwork(dataDir) {
  const file = artworkFile(dataDir);
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeArtwork(dataDir, pieces) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(artworkFile(dataDir), `${JSON.stringify(pieces, null, 2)}\n`);
}

// art-001, art-002, ... continuing from the highest existing numeric suffix.
function nextSlug(pieces) {
  const max = pieces.reduce((highest, p) => {
    const match = /^art-(\d+)$/.exec(p.slug);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  return `art-${String(max + 1).padStart(3, '0')}`;
}

function addArtwork(dataDir, { source, alt }) {
  const pieces = listArtwork(dataDir);
  const slug = nextSlug(pieces);
  const entry = { slug, source, alt, date: new Date().toISOString() };
  writeArtwork(dataDir, [...pieces, entry]);
  return entry;
}

function updateArtworkAlt(dataDir, slug, alt) {
  const pieces = listArtwork(dataDir);
  const updated = pieces.map((p) => (p.slug === slug ? { ...p, alt } : p));
  writeArtwork(dataDir, updated);
  return updated.find((p) => p.slug === slug) || null;
}

function deleteArtwork(dataDir, slug) {
  const pieces = listArtwork(dataDir);
  const remaining = pieces.filter((p) => p.slug !== slug);
  writeArtwork(dataDir, remaining);

  [`full/${slug}.webp`, `thumb/${slug}.webp`].forEach((rel) => {
    const file = path.join(dataDir, rel);
    if (fs.existsSync(file)) fs.unlinkSync(file);
  });
}

module.exports = {
  resolveDataDir, listArtwork, writeArtwork, nextSlug, addArtwork, updateArtworkAlt, deleteArtwork,
};
