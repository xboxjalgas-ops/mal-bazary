const test = require('node:test');
const assert = require('node:assert/strict');
const userHandler = require('../api/user');

test('an unverified phone cannot claim a legacy profile', async t => {
  const oldFetch = global.fetch;
  const oldUrl = process.env.SUPABASE_URL;
  const oldKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  t.after(() => {
    global.fetch = oldFetch;
    if (oldUrl === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = oldUrl;
    if (oldKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = oldKey;
  });
  process.env.SUPABASE_URL = 'https://db.test';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-only';
  let writes = 0;
  global.fetch = async (input, options = {}) => {
    const url = new URL(input);
    if (options.method === 'PATCH' || options.method === 'POST') writes++;
    if (url.pathname === '/auth/v1/user') return { ok: true, json: async () => ({ id: '11111111-1111-4111-8111-111111111111', email: 'buyer@example.test' }) };
    if (url.pathname === '/rest/v1/users' && url.searchParams.has('phone')) return { ok: true, json: async () => [{ id: '22222222-2222-4222-8222-222222222222', auth_user_id: null }] };
    throw new Error(`Unexpected request: ${url.pathname}`);
  };
  const res = {
    code: 200,
    headers: {},
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; },
  };
  await userHandler({ method: 'POST', url: '/api/user', body: { name: 'Сатып алушы', phone: '+77001112233' }, headers: { authorization: 'Bearer test', 'content-type': 'application/json' } }, res);
  assert.equal(res.code, 409);
  assert.equal(writes, 0);
});
