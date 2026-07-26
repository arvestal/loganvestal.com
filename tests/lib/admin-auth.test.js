const { createAdminToken, verifyAdminToken, parseAdminEmails } = require('../../src/lib/admin-auth');

describe('parseAdminEmails', () => {
  it('splits a comma-delimited list and trims whitespace', () => {
    expect(parseAdminEmails('a@gmail.com, b@gmail.com,c@gmail.com')).toEqual([
      'a@gmail.com', 'b@gmail.com', 'c@gmail.com',
    ]);
  });

  it('returns an empty array for undefined or blank input', () => {
    expect(parseAdminEmails(undefined)).toEqual([]);
    expect(parseAdminEmails('')).toEqual([]);
  });

  it('filters out empty entries from stray commas', () => {
    expect(parseAdminEmails('a@gmail.com,,b@gmail.com,')).toEqual(['a@gmail.com', 'b@gmail.com']);
  });
});

describe('createAdminToken / verifyAdminToken', () => {
  it('verifies a token it created itself against an allow list containing that email', () => {
    const token = createAdminToken('arvestal@gmail.com', 'test-secret');
    expect(verifyAdminToken(token, 'test-secret', ['arvestal@gmail.com', 'ljvestal@gmail.com']))
      .toMatchObject({ email: 'arvestal@gmail.com' });
  });

  it('verifies a second admin email in the same allow list', () => {
    const token = createAdminToken('ljvestal@gmail.com', 'test-secret');
    expect(verifyAdminToken(token, 'test-secret', ['arvestal@gmail.com', 'ljvestal@gmail.com']))
      .toMatchObject({ email: 'ljvestal@gmail.com' });
  });

  it('rejects a token whose email is not in the allow list', () => {
    const token = createAdminToken('someone-else@gmail.com', 'test-secret');
    expect(verifyAdminToken(token, 'test-secret', ['arvestal@gmail.com'])).toBeNull();
  });

  it('rejects a token signed with a different secret', () => {
    const token = createAdminToken('arvestal@gmail.com', 'test-secret');
    expect(verifyAdminToken(token, 'wrong-secret', ['arvestal@gmail.com'])).toBeNull();
  });

  it('rejects a malformed token', () => {
    expect(verifyAdminToken('not-a-real-token', 'test-secret', ['arvestal@gmail.com'])).toBeNull();
  });

  it('returns null when there is no token at all', () => {
    expect(verifyAdminToken(undefined, 'test-secret', ['arvestal@gmail.com'])).toBeNull();
    expect(verifyAdminToken('', 'test-secret', ['arvestal@gmail.com'])).toBeNull();
  });

  it('rejects an expired token', () => {
    const jwt = require('jsonwebtoken');
    const expired = jwt.sign({ email: 'arvestal@gmail.com' }, 'test-secret', { expiresIn: -10 });
    expect(verifyAdminToken(expired, 'test-secret', ['arvestal@gmail.com'])).toBeNull();
  });
});
