const { normalizePhone, sign, safeEqual, createSessionToken, noStore } = require('../lib/auth');

module.exports = async (req, res) => {
  noStore(res);
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed' });
  try {
    const token = String(req.body?.token || '').trim();
    if (!token || token.length > 4096) return res.status(400).json({ ok: false, message: 'Код жоқ немесе тым ұзын' });
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 3) return res.status(400).json({ ok: false, message: 'Код жарамсыз' });
    const phone = normalizePhone(parts[0]);
    const expiresAt = Number(parts[1]);
    if (!phone || !Number.isSafeInteger(expiresAt)) return res.status(400).json({ ok: false, message: 'Код жарамсыз' });
    if (!safeEqual(parts[2], sign(`${phone}:${expiresAt}`))) return res.status(400).json({ ok: false, message: 'Код жарамсыз' });
    if (Date.now() > expiresAt) return res.status(400).json({ ok: false, message: 'Кодтың мерзімі өтті, Telegram-нан қайта сұраңыз' });
    if (expiresAt - Date.now() > 11 * 60 * 1000) return res.status(400).json({ ok: false, message: 'Код жарамсыз' });
    return res.status(200).json({ ok: true, phone, sessionToken: createSessionToken(phone) });
  } catch {
    return res.status(500).json({ ok: false, message: 'Серверде қате пайда болды' });
  }
};
