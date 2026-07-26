// netlify/functions/create-session.js
const crypto = require('crypto');
function sign(payload) {
  return crypto.createHmac('sha256', process.env.OTP_SECRET).update(payload).digest('hex');
}
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { body = {}; }
  const phone = String(body.phone || '').trim();
  if (!phone) return { statusCode: 400, body: JSON.stringify({ ok: false, message: 'Телефон жоқ' }) };

  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
  const payload = `session:${phone}:${expiresAt}`;
  const signature = sign(payload);
  const token = Buffer.from(`${payload}:${signature}`).toString('base64');
  return { statusCode: 200, body: JSON.stringify({ ok: true, token }) };
};
