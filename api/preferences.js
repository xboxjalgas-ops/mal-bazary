const { requireAuth, noStore } = require('../lib/auth');
const { protect } = require('../lib/security');

const headers = extra => ({
  apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
  ...extra,
});
const root = () => `${process.env.SUPABASE_URL}/rest/v1`;
const idOk = value => /^[0-9a-f-]{36}$/i.test(String(value || ''));

async function rows(path, options = {}) {
  const response = await fetch(`${root()}${path}`, {
    ...options,
    headers: headers(options.headers || {}),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.status === 204 ? [] : response.json();
}

module.exports = async (req, res) => {
  noStore(res);
  if (!protect(req, res, {
    write: req.method !== 'GET',
    methods: ['GET', 'PUT'],
    limit: 90,
    windowMs: 60_000,
    maxBytes: 30_000,
  })) return;

  const auth = await requireAuth(req, res);
  if (!auth) return;

  try {
    if (req.method === 'GET') {
      const favorites = await rows(`/favorites?select=listing_id&user_id=eq.${auth.id}&order=created_at.desc&limit=500`);
      return res.json({ ok: true, favorites: favorites.map(item => item.listing_id) });
    }

    const listingId = String(req.body?.listing_id || '');
    const favorite = Boolean(req.body?.favorite);
    if (!idOk(listingId)) return res.status(400).json({ ok: false, message: 'Хабарландыру ID қате' });

    const listing = await rows(`/listings?select=id&id=eq.${listingId}&moderation_status=eq.approved&limit=1`);
    if (!listing.length) return res.status(404).json({ ok: false, message: 'Хабарландыру табылмады' });

    if (favorite) {
      await rows('/favorites?on_conflict=user_id,listing_id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Prefer: 'resolution=ignore-duplicates,return=representation',
        },
        body: JSON.stringify([{ user_id: auth.id, listing_id: listingId }]),
      });
    } else {
      await rows(`/favorites?user_id=eq.${auth.id}&listing_id=eq.${listingId}`, {
        method: 'DELETE',
        headers: { Prefer: 'return=minimal' },
      });
    }
    return res.json({ ok: true, listing_id: listingId, favorite });
  } catch (error) {
    console.error('preferences', error.message);
    return res.status(500).json({ ok: false, message: 'Таңдаулыларды сақтау қатесі' });
  }
};