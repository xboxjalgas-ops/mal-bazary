const { requireAuth, noStore } = require('../lib/auth');

function supabaseHeaders(extra = {}) {
  return { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`, ...extra };
}

module.exports = async (req, res) => {
  noStore(res);
  const session = requireAuth(req, res);
  if (!session) return;
  const phone = session.phone;
  try {
    if (req.method === 'GET') {
      const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/users?select=name,phone,avatar_url&phone=eq.${encodeURIComponent(phone)}&limit=1`, { headers: supabaseHeaders() });
      if (!r.ok) return res.status(502).json({ ok: false, message: 'Дерекқор қатесі' });
      const data = await r.json();
      return data.length ? res.status(200).json({ ok: true, exists: true, name: data[0].name, phone, avatar_url: data[0].avatar_url || null }) : res.status(200).json({ ok: true, exists: false, phone });
    }
    if (req.method === 'POST') {
      const name = String(req.body?.name || '').trim().replace(/\s+/g, ' ');
      if (name.length < 2 || name.length > 80) return res.status(400).json({ ok: false, message: 'Аты-жөні 2–80 таңба болуы керек' });
      const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/users?on_conflict=phone`, {
        method: 'POST', headers: supabaseHeaders({ 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=representation' }),
        body: JSON.stringify([{ phone, name }]),
      });
      if (!r.ok) return res.status(502).json({ ok: false, message: 'Дерекқорға жазу қатесі' });
      const data = await r.json();
      return res.status(200).json({ ok: true, name: data[0].name, phone });
    }
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  } catch {
    return res.status(500).json({ ok: false, message: 'Серверде қате' });
  }
};
