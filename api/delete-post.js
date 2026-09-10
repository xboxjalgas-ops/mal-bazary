const { requireAuth, noStore } = require('../lib/auth');
module.exports = async (req, res) => {
  noStore(res);
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed' });
  const session = requireAuth(req, res); if (!session) return;
  const { kind, id } = req.body || {};
  if (!['listing', 'product'].includes(kind) || !/^[0-9a-f-]{36}$/i.test(String(id || ''))) return res.status(400).json({ ok: false, message: 'Деректер қате' });
  const table = kind === 'product' ? 'products' : 'listings';
  try {
    const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}&seller_phone=eq.${encodeURIComponent(session.phone)}`, {
      method: 'DELETE', headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`, Prefer: 'return=representation' },
    });
    if (!r.ok) return res.status(502).json({ ok: false, message: 'Өшіру қатесі' });
    const data = await r.json();
    if (!data.length) return res.status(403).json({ ok: false, message: 'Бұл жарияланым сізге тиесілі емес' });
    return res.status(200).json({ ok: true });
  } catch { return res.status(500).json({ ok: false, message: 'Серверде қате' }); }
};
