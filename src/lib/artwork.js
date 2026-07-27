// Maps the volume-backed artwork.json entries (see src/lib/artwork-store.js) into the shape the
// homepage gallery needs. artwork.json is the single source of truth (slug, source, alt, date) —
// there's no separate manifest to join against once the admin panel owns this data.
function buildGalleryArtwork(pieces) {
  return pieces.map((p) => ({
    slug: p.slug,
    thumb: `/img/art/thumb/${p.slug}.webp`,
    full: `/img/art/full/${p.slug}.webp`,
    alt: p.alt || '',
    caption: p.caption || '',
  }));
}

module.exports = { buildGalleryArtwork };
