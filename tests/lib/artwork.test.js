const { buildGalleryArtwork } = require('../../src/lib/artwork');

describe('buildGalleryArtwork', () => {
  it('builds thumb/full URLs for each piece, preserving order and alt text', () => {
    const pieces = [
      { slug: 'art-001', source: 'IMG_0001.jpeg', date: '2020-01-01T00:00:00.000Z', alt: 'First piece' },
      { slug: 'art-002', source: 'IMG_0002.jpeg', date: '2020-01-02T00:00:00.000Z', alt: 'Second piece' },
    ];

    expect(buildGalleryArtwork(pieces)).toEqual([
      {
        slug: 'art-001',
        thumb: '/img/art/thumb/art-001.webp',
        full: '/img/art/full/art-001.webp',
        alt: 'First piece',
      },
      {
        slug: 'art-002',
        thumb: '/img/art/thumb/art-002.webp',
        full: '/img/art/full/art-002.webp',
        alt: 'Second piece',
      },
    ]);
  });

  it('falls back to an empty string when a piece has no alt text', () => {
    const pieces = [{ slug: 'art-003', source: 'IMG_0003.jpeg', date: '2020-01-03T00:00:00.000Z' }];
    expect(buildGalleryArtwork(pieces)).toEqual([
      { slug: 'art-003', thumb: '/img/art/thumb/art-003.webp', full: '/img/art/full/art-003.webp', alt: '' },
    ]);
  });
});
