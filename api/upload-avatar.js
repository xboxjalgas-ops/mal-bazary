const { requireAuth, noStore } = require('../lib/auth');
const ALLOWED = {
  'image/jpeg': { ext: 'jpg', test: b => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  'image/png': { ext: 'png', test: b => b.slice(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) },
  'image/webp': { ext: 'webp', test: b => b.slice(0,4).toString() === 'RIFF' && b.slice(8,12).toString() === 'WEBP' },
};
const MAX_BYTES = 2 * 1024 * 1024;
module.exports = async (req, res) => {
  noStore(res);
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed' });
  const session = requireAuth(req, res); if (!session) return;
  const mimeType = String(req.body?.mimeType || ''), imageBase64 = String(req.body?.imageBase64 || '').trim();
  const format = ALLOWED[mimeType];
  if (!format || !imageBase64 || imageBase64.length > 3_000_000) return res.status(400).json({ ok: false, message: 'JPEG, PNG немесе WEBP суретін таңдаңыз' });
  let buffer;
  try { buffer = Buffer.from(imageBase64, 'base64'); } catch { return res.status(400).json({ ok: false, message: 'Сурет деректері қате' }); }
  if (!buffer.length || buffer.length > MAX_BYTES || !format.test(buffer)) return res.status(400).json({ ok: false, message: 'Сурет қате немесе 2 МБ-тан үлкен' });
  try {
    const common = { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` };
    const path = `${session.phone.replace(/\D/g, '')}.${format.ext}`;
    const upload = await fetch(`${process.env.SUPABASE_URL}/storage/v1/object/avatars/${path}`, { method: 'POST', headers: { ...common, 'Content-Type': mimeType, 'x-upsert': 'true' }, body: buffer });
    if (!upload.ok) return res.status(502).json({ ok: false, message: 'Сурет жүктеу қатесі' });
    const stableUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/avatars/${path}`;
    const update = await fetch(`${process.env.SUPABASE_URL}/rest/v1/users?phone=eq.${encodeURIComponent(session.phone)}`, {
      method: 'PATCH', headers: { ...common, 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify({ avatar_url: stableUrl }),
    });
    if (!update.ok) return res.status(502).json({ ok: false, message: 'Профильді жаңарту қатесі' });
    const rows = await update.json();
    if (!rows.length) return res.status(404).json({ ok: false, message: 'Қолданушы табылмады' });
    return res.status(200).json({ ok: true, avatar_url: `${stableUrl}?t=${Date.now()}` });
  } catch { return res.status(500).json({ ok: false, message: 'Серверде қате' }); }
};
