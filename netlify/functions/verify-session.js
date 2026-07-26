// netlify/functions/verify-session.js
const crypto = require('crypto');
function sign(payload) {
  return crypto.createHmac('sha256', process.env.OTP_SECRET).update(payload).digest('hex');
}
function safeEqual(a, b) {
  const bufA = Buffer.from(a), bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  try {
    const body = JSON.parse(event.body || '{}');
    const token = String(body.token || '').trim();
    if (!token) return { statusCode: 400, body: JSON.stringify({ ok: false, message: 'Токен жоқ' }) };

    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 4 || parts[0] !== 'session') {
      return { statusCode: 400, body: JSON.stringify({ ok: false, message: 'Токен жарамсыз' }) };
    }
    const [, phone, expiresAt, signature] = parts;
    const payload = `session:${phone}:${expiresAt}`;
    const expected = sign(payload);
    if (!safeEqual(signature, expected)) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, message: 'Токен жарамсыз' }) };
    }
    if (Date.now() > Number(expiresAt)) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, message: 'Сессия мерзімі өтті' }) };
    }
    return { statusCode: 200, body: JSON.stringify({ ok: true, phone }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, message: 'Серверде қате' }) };
  }
};
