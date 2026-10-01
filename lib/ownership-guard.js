/* Additional ownership check before the original update/delete handler. */
const { requireAuth } = require('./auth');
const { sameOrigin, securityHeaders } = require('./security');
function canManage(auth, profile, row, adminEmails = '') {
  if (!auth?.id || !profile || profile.blocked || !row) return false;
  const admin = profile.role === 'admin' || String(adminEmails).split(',').map(v => v.trim().toLowerCase()).filter(Boolean).includes(String(auth.email || '').toLowerCase());
  return admin || row.seller_auth_id === auth.id;
}
function withOwnership(handler, operation) {
  return async (req, res) => {
    securityHeaders(res);
    if (req.method !== 'POST') return handler(req, res);
    if (!sameOrigin(req) || req.headers?.['sec-fetch-site'] === 'cross-site') return res.status(403).json({ ok: false, message: 'Сұрау көзіне рұқсат жоқ' });
    const id = String(req.body?.id || '');
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return res.status(400).json({ ok: false, message: 'ID қате' });
    const kind = operation === 'update' ? 'listing' : req.body?.kind;
    if (!['listing','product'].includes(kind)) return res.status(400).json({ ok: false, message: 'Деректер қате' });
    const auth = await requireAuth(req, res); if (!auth) return;
    const headers = { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` };
    const table = kind === 'product' ? 'products' : 'listings';
    try {
      const [profileResponse, rowResponse] = await Promise.all([
        fetch(`${process.env.SUPABASE_URL}/rest/v1/users?select=role,blocked&auth_user_id=eq.${encodeURIComponent(auth.id)}&limit=1`, { headers }),
        fetch(`${process.env.SUPABASE_URL}/rest/v1/${table}?select=seller_auth_id&id=eq.${encodeURIComponent(id)}&limit=1`, { headers })
      ]);
      if (!profileResponse.ok || !rowResponse.ok) return res.status(503).json({ ok: false, message: 'Рұқсатты тексеру мүмкін болмады' });
      const [profiles, rows] = await Promise.all([profileResponse.json(), rowResponse.json()]);
      if (!canManage(auth, profiles[0], rows[0], process.env.ADMIN_EMAILS)) return res.status(403).json({ ok: false, message: 'Бұл жарияланымды өзгертуге рұқсат жоқ' });
      return handler(req, res);
    } catch {
      return res.status(503).json({ ok: false, message: 'Рұқсатты тексеру мүмкін болмады' });
    }
  };
}
module.exports = { canManage, withOwnership };
