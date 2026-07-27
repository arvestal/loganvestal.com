const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  resolveDataDir, listArtwork, writeArtwork, nextSlug, addArtwork, updateArtwork, deleteArtwork,
} = require('../../src/lib/artwork-store');

describe('resolveDataDir', () => {
  const original = process.env.ARTWORK_DATA_DIR;

  afterEach(() => {
    if (original === undefined) delete process.env.ARTWORK_DATA_DIR;
    else process.env.ARTWORK_DATA_DIR = original;
  });

  it('uses ARTWORK_DATA_DIR when set', () => {
    process.env.ARTWORK_DATA_DIR = '/data/artwork';
    expect(resolveDataDir()).toBe('/data/artwork');
  });

  it('falls back to a local .artwork-data folder when unset', () => {
    delete process.env.ARTWORK_DATA_DIR;
    expect(resolveDataDir()).toContain('.artwork-data');
  });
});

describe('listArtwork', () => {
  let dataDir;

  beforeEach(() => {
    dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'artwork-store-'));
  });

  it('returns an empty array when artwork.json does not exist yet', () => {
    expect(listArtwork(dataDir)).toEqual([]);
  });

  it('returns the parsed contents when artwork.json exists', () => {
    writeArtwork(dataDir, [{ slug: 'art-001', source: 'a.jpg', alt: 'A', date: '2020-01-01T00:00:00.000Z' }]);
    expect(listArtwork(dataDir)).toEqual([{ slug: 'art-001', source: 'a.jpg', alt: 'A', date: '2020-01-01T00:00:00.000Z' }]);
  });
});

describe('nextSlug', () => {
  it('returns art-001 for an empty list', () => {
    expect(nextSlug([])).toBe('art-001');
  });

  it('continues from the highest existing numeric suffix', () => {
    const pieces = [{ slug: 'art-003' }, { slug: 'art-001' }, { slug: 'art-250' }];
    expect(nextSlug(pieces)).toBe('art-251');
  });

  it('ignores slugs that do not match the art-NNN pattern', () => {
    expect(nextSlug([{ slug: 'not-an-art-slug' }])).toBe('art-001');
  });
});

describe('addArtwork / updateArtwork / deleteArtwork', () => {
  let dataDir;

  beforeEach(() => {
    dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'artwork-store-'));
  });

  it('appends a new piece with the next slug and current date', () => {
    const entry = addArtwork(dataDir, { source: 'new.jpg', alt: 'A new piece', caption: 'A caption' });
    expect(entry.slug).toBe('art-001');
    expect(entry.source).toBe('new.jpg');
    expect(entry.alt).toBe('A new piece');
    expect(entry.caption).toBe('A caption');
    expect(typeof entry.date).toBe('string');
    expect(listArtwork(dataDir)).toEqual([entry]);
  });

  it('updates the alt text and caption for a matching slug and leaves others untouched', () => {
    writeArtwork(dataDir, [
      {
        slug: 'art-001', source: 'a.jpg', alt: 'old', caption: 'old caption', date: '2020-01-01T00:00:00.000Z',
      },
      {
        slug: 'art-002', source: 'b.jpg', alt: 'unchanged', caption: 'unchanged caption', date: '2020-01-02T00:00:00.000Z',
      },
    ]);

    const updated = updateArtwork(dataDir, 'art-001', { alt: 'new alt text', caption: 'new caption' });
    expect(updated.alt).toBe('new alt text');
    expect(updated.caption).toBe('new caption');
    expect(listArtwork(dataDir)).toEqual([
      {
        slug: 'art-001', source: 'a.jpg', alt: 'new alt text', caption: 'new caption', date: '2020-01-01T00:00:00.000Z',
      },
      {
        slug: 'art-002', source: 'b.jpg', alt: 'unchanged', caption: 'unchanged caption', date: '2020-01-02T00:00:00.000Z',
      },
    ]);
  });

  it('returns null from updateArtwork when the slug does not exist', () => {
    writeArtwork(dataDir, [{ slug: 'art-001', source: 'a.jpg', alt: 'old', date: '2020-01-01T00:00:00.000Z' }]);
    expect(updateArtwork(dataDir, 'art-999', { alt: 'x', caption: 'y' })).toBeNull();
  });

  it('removes an artwork entry and its image files', () => {
    writeArtwork(dataDir, [{ slug: 'art-001', source: 'a.jpg', alt: 'A', date: '2020-01-01T00:00:00.000Z' }]);
    fs.mkdirSync(path.join(dataDir, 'full'), { recursive: true });
    fs.mkdirSync(path.join(dataDir, 'thumb'), { recursive: true });
    fs.writeFileSync(path.join(dataDir, 'full/art-001.webp'), 'x');
    fs.writeFileSync(path.join(dataDir, 'thumb/art-001.webp'), 'x');

    deleteArtwork(dataDir, 'art-001');

    expect(listArtwork(dataDir)).toEqual([]);
    expect(fs.existsSync(path.join(dataDir, 'full/art-001.webp'))).toBe(false);
    expect(fs.existsSync(path.join(dataDir, 'thumb/art-001.webp'))).toBe(false);
  });

  it('does not error when deleting a piece whose image files are already missing', () => {
    writeArtwork(dataDir, [{ slug: 'art-001', source: 'a.jpg', alt: 'A', date: '2020-01-01T00:00:00.000Z' }]);
    expect(() => deleteArtwork(dataDir, 'art-001')).not.toThrow();
    expect(listArtwork(dataDir)).toEqual([]);
  });
});
