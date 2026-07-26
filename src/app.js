require('dotenv').config();

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const { engine } = require('express-handlebars');

const helpers = require('./lib/helpers');

const app = express();
const PORT = process.env.PORT || 8080;
const ASSET_VERSION = process.env.RAILWAY_GIT_COMMIT_SHA || 'dev';

// Set this to the site's bare domain once it has one (e.g. "example.com").
// Leave blank during early development — the www-redirect and canonical-URL
// logic below both no-op gracefully without it.
const SITE_HOST = process.env.SITE_HOST || '';

// Railway terminates TLS in front of the app; trust its X-Forwarded-* headers so
// req.protocol/req.secure reflect the real client-facing connection.
app.set('trust proxy', 1);

app.engine('hbs', engine({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, '../views/layouts'),
  partialsDir: path.join(__dirname, '../views/partials'),
  helpers,
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, '../views'));

app.use(express.static(path.join(__dirname, '../public')));
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

// Serves artwork images from the persistent volume (ARTWORK_DATA_DIR) instead of public/, so
// admin uploads/deletes take effect without a redeploy.
const { resolveDataDir } = require('./lib/artwork-store');
app.use('/img/art', express.static(resolveDataDir()));

// Railway deployment healthcheck target.
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// www → root redirect. No-ops until SITE_HOST is set.
app.use((req, res, next) => {
  if (SITE_HOST && req.hostname === `www.${SITE_HOST}`) {
    return res.redirect(301, `https://${SITE_HOST}${req.originalUrl}`);
  }
  next();
});

app.use((req, res, next) => {
  res.locals.currentYear = new Date().getFullYear();
  res.locals.canonicalUrl = SITE_HOST ? `https://${SITE_HOST}${req.path}` : undefined;
  res.locals.assetVersion = ASSET_VERSION;
  next();
});

app.use('/', require('./routes/index'));
app.use('/admin', require('./routes/admin'));

app.use((req, res) => {
  res.status(404).render('error', {
    pageTitle: 'Page Not Found',
    message: "The page you're looking for doesn't exist.",
    noIndex: true,
  });
});

/* istanbul ignore if -- exercised by starting the process, not by tests */
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
