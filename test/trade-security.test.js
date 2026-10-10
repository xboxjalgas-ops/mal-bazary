const test = require('node:test');
const assert = require('node:assert/strict');
const handler = require('../api/community');
process.env.SUPABASE_URL = 'https://db.test';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-only';

const buyer = '11111111-1111-4111-8111-111111111111';
const seller = '22222222-2222-4222-8222-222222222222';
const listingId = '33333333-3333-4333-8333-333333333333';
const reservationId = '44444444-4444-4444-8444-444444444444';

function response() {
  return {
    code: 200,
    headers: {},
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

function mockDatabase(state) {
  return async (input, options = {}) => {
    const url = new URL(input);
    const reply = (body, status = 200) => ({ ok: status < 400, status, json: async () => body, text: async () => JSON.stringify(body) });
    if (url.pathname === '/auth/v1/user') return reply({ id: state.actor, email: `${state.actor}@example.test` });
    if (url.pathname.endsWith('/users')) return reply([{ name: 'Қолданушы', blocked: false, role: 'user' }]);
    if (url.pathname.endsWith('/listings')) return reply([{ id: listingId, seller_auth_id: seller, status: 'active', moderation_status: 'approved', title: 'Меринос' }]);
    if (url.pathname.endsWith('/offers')) return reply(state.offers || []);
    if (url.pathname.endsWith('/reservations')) {
      if (options.method !== 'PATCH') return reply([]);
      const id = url.searchParams.get('id')?.slice(3);
      const role = url.searchParams.get('buyer_id')?.slice(3) || url.searchParams.get('seller_id')?.slice(3);
      const requiredStatus = url.searchParams.get('status')?.slice(3);
      if (id !== reservationId || role !== state.actor || requiredStatus !== state.status) return reply([]);
      state.status = JSON.parse(options.body).status;
      return reply([{ id: reservationId, status: state.status }]);
    }
    throw new Error(`Unexpected request: ${url.pathname}`);
  };
}

async function change(actor, status) {
  const res = response();
  await handler({ method: 'PATCH', url: '/api/community', query: { mode: 'reservation_status' }, body: { id: reservationId, status }, headers: { authorization: 'Bearer test' } }, res);
  return res;
}

test('only seller accepts pending reservation; only buyer confirms receipt afterwards', async t => {
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });
  const state = { actor: seller, status: 'pending' };
  global.fetch = mockDatabase(state);

  assert.equal((await change(seller, 'completed')).code, 403);
  state.actor = buyer;
  assert.equal((await change(buyer, 'completed')).code, 403);
  state.actor = seller;
  assert.equal((await change(seller, 'accepted')).code, 200);
  state.actor = buyer;
  assert.equal((await change(buyer, 'completed')).code, 200);
  state.actor = seller;
  assert.equal((await change(seller, 'rejected')).code, 403);
  assert.equal(state.status, 'completed');
});

test('existing offer cannot be reset to pending by a new offer request', async t => {
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });
  const state = { actor: buyer, offers: [{ id: reservationId, status: 'accepted' }] };
  global.fetch = mockDatabase(state);
  const res = response();
  await handler({ method: 'POST', url: '/api/community', query: { mode: 'make_offer' }, body: { listing_id: listingId, amount: 100000 }, headers: { authorization: 'Bearer test' } }, res);
  assert.equal(res.code, 409);
  assert.equal(state.offers[0].status, 'accepted');
});
