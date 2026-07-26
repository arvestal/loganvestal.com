const crypto = require('crypto');
const express = require('express');
const multer = require('multer');
const { OAuth2Client } = require('google-auth-library');

const {
  createAdminToken, verifyAdminToken, parseAdminEmails, TOKEN_COOKIE, STATE_COOKIE, STATE_TTL_MS,
} = require('../lib/admin-auth');
const {
  resolveDataDir, listArtwork, addArtwork, updateArtworkAlt, deleteArtwork,
} = require('../lib/artwork-store');
const { processUpload } = require('../lib/artwork-upload');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const TOKEN_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function secureCookies() {
  return process.env.NODE_ENV === 'production';
}

function oauthClient() {
  return new OAuth2Client({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: `${process.env.BASE_URL}/admin/auth/google/callback`,
  });
}

function requireAdmin(req, res, next) {
  const allowedEmails = parseAdminEmails(process.env.ADMIN_EMAIL);
  if (!allowedEmails.length) {
    return res.status(500).render('error', {
      pageTitle: 'Admin Not Configured',
      message: 'ADMIN_EMAIL is not set for this deployment.',
      noIndex: true,
    });
  }

  const payload = verifyAdminToken(req.cookies[TOKEN_COOKIE], process.env.ADMIN_JWT_SECRET, allowedEmails);
  if (!payload) {
    return res.redirect('/admin/login');
  }

  req.adminEmail = payload.email;
  return next();
}

router.get('/login', (req, res) => {
  res.render('admin/login', { pageTitle: 'Admin Login', noIndex: true });
});

router.get('/auth/google', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  res.cookie(STATE_COOKIE, state, {
    httpOnly: true, secure: secureCookies(), sameSite: 'lax', maxAge: STATE_TTL_MS,
  });

  const url = oauthClient().generateAuthUrl({ scope: ['email'], state });
  res.redirect(url);
});

router.get('/auth/google/callback', async (req, res) => {
  const { code, state } = req.query;
  const cookieState = req.cookies[STATE_COOKIE];
  res.clearCookie(STATE_COOKIE);

  if (!state || !cookieState || state !== cookieState) {
    return res.status(403).render('error', {
      pageTitle: 'Login Failed',
      message: 'Invalid login state — please try signing in again.',
      noIndex: true,
    });
  }

  try {
    const client = oauthClient();
    const { tokens } = await client.getToken(String(code));
    const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const allowedEmails = parseAdminEmails(process.env.ADMIN_EMAIL);

    if (!allowedEmails.includes(payload.email)) {
      return res.status(403).render('error', {
        pageTitle: 'Access Denied',
        message: 'This Google account is not authorized for admin access.',
        noIndex: true,
      });
    }

    const token = createAdminToken(payload.email, process.env.ADMIN_JWT_SECRET);
    res.cookie(TOKEN_COOKIE, token, {
      httpOnly: true, secure: secureCookies(), sameSite: 'lax', maxAge: TOKEN_COOKIE_MAX_AGE_MS,
    });
    return res.redirect('/admin');
  } catch {
    return res.status(403).render('error', {
      pageTitle: 'Login Failed',
      message: 'Could not complete Google sign-in.',
      noIndex: true,
    });
  }
});

router.get('/logout', (req, res) => {
  res.clearCookie(TOKEN_COOKIE);
  res.redirect('/');
});

router.use(requireAdmin);

router.get('/', (req, res) => {
  const artwork = listArtwork(resolveDataDir()).map((p) => ({
    ...p,
    thumb: `/img/art/thumb/${p.slug}.webp`,
  }));

  res.render('admin/dashboard', {
    pageTitle: 'Admin',
    noIndex: true,
    adminEmail: req.adminEmail,
    artwork,
    uploadError: req.query.uploadError,
  });
});

router.post('/artwork', upload.single('photo'), async (req, res) => {
  if (!req.file) {
    return res.redirect('/admin?uploadError=No file was uploaded.');
  }

  try {
    const dataDir = resolveDataDir();
    const entry = addArtwork(dataDir, { source: req.file.originalname, alt: req.body.alt || '' });
    await processUpload(req.file.buffer, dataDir, entry.slug);
    return res.redirect('/admin');
  } catch {
    return res.redirect('/admin?uploadError=Could not process that image — try exporting it as a JPEG first.');
  }
});

router.post('/artwork/:slug', (req, res) => {
  updateArtworkAlt(resolveDataDir(), req.params.slug, req.body.alt || '');
  res.redirect('/admin');
});

router.post('/artwork/:slug/delete', (req, res) => {
  deleteArtwork(resolveDataDir(), req.params.slug);
  res.redirect('/admin');
});

module.exports = router;
