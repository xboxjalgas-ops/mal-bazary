// api/verify-session.js  (Vercel serverless function)

const crypto = require('crypto');

function sign(payload) {
  return crypto
    .createHmac('sha256', process.env.OTP_SECRET)
    .update(payload)
    .digest('hex');
}
function safeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }
  try {
    const token = String((req.body || {}).token || '').trim();
    if (!token) return res.status(400).json({ ok: false, message: 'Токен жоқ' });

    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 4 || parts[0] !== 'session') {
      return res.status(400).json({ ok: false, message: 'Токен жарамсыз' });
    }
    const [, phone, expiresAt, signature] = parts;
    const payload = `session:${phone}:${expiresAt}`;
    const expected = sign(payload);

    if (!safeEqual(signature, expected)) {
      return res.status(400).json({ ok: false, message: 'Токен жарамсыз' });
    }
    if (Date.now() > Number(expiresAt)) {
      return res.status(400).json({ ok: false, message: 'Сессия мерзімі өтті' });
    }
    return res.status(200).json({ ok: true, phone });
  } catch (err) {
    return res.status(500).json({ ok: false, message: 'Серверде қате' });
  }
};
