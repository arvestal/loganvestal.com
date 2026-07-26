const jwt = require('jsonwebtoken');

const TOKEN_COOKIE = 'admin_token';
const STATE_COOKIE = 'oauth_state';
const TOKEN_TTL = '30d';
const STATE_TTL_MS = 5 * 60 * 1000;

function createAdminToken(email, secret) {
  return jwt.sign({ email }, secret, { expiresIn: TOKEN_TTL });
}

// ADMIN_EMAIL is a comma-delimited list so more than one Google account can administer the
// site (e.g. Logan and Allen both signing in through the same shared OAuth client).
function parseAdminEmails(raw) {
  return (raw || '').split(',').map((e) => e.trim()).filter(Boolean);
}

// Returns the decoded payload if the token is a validly-signed, unexpired JWT whose email is in
// allowedEmails, otherwise null. An email no longer in the list means ADMIN_EMAIL changed after
// the cookie was issued, or the token belongs to a different deployment's secret — both should
// fail.
function verifyAdminToken(token, secret, allowedEmails) {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, secret);
    return allowedEmails.includes(payload.email) ? payload : null;
  } catch {
    return null;
  }
}

module.exports = {
  createAdminToken, verifyAdminToken, parseAdminEmails, TOKEN_COOKIE, STATE_COOKIE, STATE_TTL_MS,
};
