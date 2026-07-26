const express = require('express');
const router = express.Router();

const { resolveDataDir, listArtwork } = require('../lib/artwork-store');
const { buildGalleryArtwork } = require('../lib/artwork');

router.get('/', (req, res) => {
  const artwork = buildGalleryArtwork(listArtwork(resolveDataDir()));

  res.render('home', {
    metaDescription: `${artwork.length} original works by Logan Vestal.`,
    artwork,
  });
});

module.exports = router;
