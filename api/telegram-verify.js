// api/telegram-verify.js  (Vercel serverless function)

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
    const { token } = req.body || {};
    if (!token) {
      return res.status(400).json({ ok: false, message: 'Код жоқ' });
    }

    const decoded = Buffer.from(String(token).trim(), 'base64').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 3) {
      return res.status(400).json({ ok: false, message: 'Код жарамсыз' });
    }
    const [phone, expiresAt, signature] = parts;
    const payload = `${phone}:${expiresAt}`;
    const expectedSignature = sign(payload);

    if (!safeEqual(signature, expectedSignature)) {
      return res.status(400).json({ ok: false, message: 'Код жарамсыз' });
    }
    if (Date.now() > Number(expiresAt)) {
      return res.status(400).json({ ok: false, message: 'Кодтың мерзімі өтті, Telegram-нан қайта сұраңыз' });
    }

    return res.status(200).json({ ok: true, phone });
  } catch (err) {
    return res.status(500).json({ ok: false, message: 'Серверде қате пайда болды' });
  }
};
