const { requireAuth, normalizePhone, isAdminEmail, noStore } = require('../lib/auth');
const {protect}=require('../lib/security');
const h = extra => ({ apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`, ...extra });
const base = () => `${process.env.SUPABASE_URL}/rest/v1/users`;

module.exports = async (req, res) => {
  noStore(res);
  if(!protect(req,res,{write:req.method!=='GET',limit:30,windowMs:600000,maxBytes:100000}))return;
  const authUser = await requireAuth(req, res); if (!authUser) return;
  try {
    if (req.method === 'GET') {
      const r = await fetch(`${base()}?select=name,phone,email,avatar_url,role,shop_name,bio,verified&auth_user_id=eq.${authUser.id}&limit=1`, { headers: h() });
      if (!r.ok) return res.status(502).json({ ok: false, message: 'Дерекқор қатесі' });
      const rows = await r.json();
      const suggestedName = String(authUser.user_metadata?.full_name || authUser.user_metadata?.name || '').trim();
      return rows.length
        ? res.status(200).json({ ok: true, exists: true, ...rows[0], role: isAdminEmail(authUser.email) ? 'admin' : (rows[0].role || 'user') })
        : res.status(200).json({ ok: true, exists: false, email: authUser.email || null, suggestedName });
    }
    if (req.method === 'POST') {
      const name = String(req.body?.name || '').trim().replace(/\s+/g, ' ');
      const phone = normalizePhone(req.body?.phone);
      if (name.length < 2 || name.length > 80) return res.status(400).json({ ok: false, message: 'Аты-жөні 2–80 таңба болуы керек' });
      if (!phone) return res.status(400).json({ ok: false, message: 'Телефон нөмірі қате' });

      const byPhone = await fetch(`${base()}?select=id,auth_user_id&phone=eq.${encodeURIComponent(phone)}&limit=1`, { headers: h() });
      if (!byPhone.ok) return res.status(502).json({ ok: false, message: 'Дерекқор қатесі' });
      const matches = await byPhone.json();
      if (matches.length && matches[0].auth_user_id && matches[0].auth_user_id !== authUser.id) {
        return res.status(409).json({ ok: false, message: 'Бұл телефон басқа аккаунтқа тіркелген' });
      }

      const payload = { auth_user_id: authUser.id, email: authUser.email || null, name, phone, role: isAdminEmail(authUser.email) ? 'admin' : 'user' };
      let url = `${base()}?auth_user_id=eq.${authUser.id}`;
      let method = 'PATCH';
      if (matches.length && !matches[0].auth_user_id) url = `${base()}?id=eq.${matches[0].id}`;
      const existing = await fetch(`${base()}?select=id&auth_user_id=eq.${authUser.id}&limit=1`, { headers: h() });
      const existingRows = existing.ok ? await existing.json() : [];
      if (!existingRows.length && !matches.length) { url = base(); method = 'POST'; }

      const r = await fetch(url, { method, headers: h({ 'Content-Type': 'application/json', Prefer: 'return=representation' }), body: JSON.stringify(method === 'POST' ? [payload] : payload) });
      if (!r.ok) return res.status(502).json({ ok: false, message: 'Профильді сақтау қатесі' });
      const rows = await r.json();
      return res.status(200).json({ ok: true, name: rows[0].name, phone: rows[0].phone, email: rows[0].email, role: rows[0].role || (isAdminEmail(authUser.email) ? 'admin' : 'user'), avatar_url: rows[0].avatar_url || null, shop_name: rows[0].shop_name || '', bio: rows[0].bio || '', verified: Boolean(rows[0].verified) });
    }
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  } catch { return res.status(500).json({ ok: false, message: 'Серверде қате' }); }
};
