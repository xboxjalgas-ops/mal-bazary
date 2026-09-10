const crypto = require('crypto');

function getSecret() {
  const secret = process.env.OTP_SECRET;
  if (!secret || secret.length < 32) throw new Error('OTP_SECRET is missing or too short');
  return secret;
}

function normalizePhone(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 10) digits = `7${digits}`;
  if (digits.length === 11 && digits.startsWith('8')) digits = `7${digits.slice(1)}`;
  if (digits.length !== 11 || !digits.startsWith('7')) return null;
  return `+${digits}`;
}

function sign(payload) {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
}

function safeEqual(a, b) {
  if (!/^[a-f0-9]{64}$/i.test(String(a || '')) || !/^[a-f0-9]{64}$/i.test(String(b || ''))) return false;
  return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}

function createSessionToken(phone, maxAgeMs = 30 * 24 * 60 * 60 * 1000) {
  const normalized = normalizePhone(phone);
  if (!normalized) throw new Error('Invalid phone');
  const expiresAt = Date.now() + maxAgeMs;
  const payload = `session:${normalized}:${expiresAt}`;
  return Buffer.from(`${payload}:${sign(payload)}`).toString('base64');
}

function verifySessionToken(token) {
  if (!token || String(token).length > 2048) return null;
  try {
    const decoded = Buffer.from(String(token), 'base64').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 4 || parts[0] !== 'session') return null;
    const phone = normalizePhone(parts[1]);
    const expiresAt = Number(parts[2]);
    if (!phone || !Number.isSafeInteger(expiresAt) || expiresAt <= Date.now()) return null;
    const payload = `session:${phone}:${expiresAt}`;
    if (!safeEqual(parts[3], sign(payload))) return null;
    return { phone, expiresAt };
  } catch {
    return null;
  }
}

function getBearerToken(req) {
  const header = String(req.headers?.authorization || '');
  return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
}

function requireAuth(req, res) {
  const session = verifySessionToken(getBearerToken(req));
  if (!session) {
    res.status(401).json({ ok: false, message: 'Кіру қажет немесе сессия мерзімі аяқталған' });
    return null;
  }
  return session;
}

function noStore(res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

module.exports = { normalizePhone, sign, safeEqual, createSessionToken, verifySessionToken, getBearerToken, requireAuth, noStore };
