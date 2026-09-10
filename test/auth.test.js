const test = require('node:test');
const assert = require('node:assert/strict');
process.env.OTP_SECRET = 'test-secret-that-is-at-least-32-characters-long';
const { normalizePhone, createSessionToken, verifySessionToken } = require('../lib/auth');

test('normalizes Kazakhstan phone formats', () => {
  assert.equal(normalizePhone('8 701 234 56 78'), '+77012345678');
  assert.equal(normalizePhone('+7 701 234 56 78'), '+77012345678');
  assert.equal(normalizePhone('7012345678'), '+77012345678');
  assert.equal(normalizePhone('123'), null);
});

test('creates and verifies signed sessions', () => {
  const token = createSessionToken('+7 701 234 56 78');
  assert.equal(verifySessionToken(token).phone, '+77012345678');
  assert.equal(verifySessionToken(token.slice(0, -2) + 'xx'), null);
});
