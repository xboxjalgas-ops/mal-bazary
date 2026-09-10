const { getBearerToken, verifySessionToken, noStore } = require('../lib/auth');

module.exports = async (req, res) => {
  noStore(res);
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed' });
  const token = getBearerToken(req) || String(req.body?.token || '').trim();
  const session = verifySessionToken(token);
  if (!session) return res.status(401).json({ ok: false, message: 'Сессия жарамсыз немесе мерзімі аяқталған' });
  return res.status(200).json({ ok: true, phone: session.phone, expiresAt: session.expiresAt });
};
