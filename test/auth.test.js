const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizePhone, getBearerToken } = require('../lib/auth');

test('normalizes Kazakhstan phone formats', () => {
  assert.equal(normalizePhone('8 701 234 56 78'), '+77012345678');
  assert.equal(normalizePhone('+7 701 234 56 78'), '+77012345678');
  assert.equal(normalizePhone('7012345678'), '+77012345678');
  assert.equal(normalizePhone('123'), null);
});

test('reads bearer token only', () => {
  assert.equal(getBearerToken({ headers: { authorization: 'Bearer token123' } }), 'token123');
  assert.equal(getBearerToken({ headers: { authorization: 'Basic abc' } }), '');
});
