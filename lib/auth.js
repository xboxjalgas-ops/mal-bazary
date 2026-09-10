function normalizePhone(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 10) digits = `7${digits}`;
  if (digits.length === 11 && digits.startsWith('8')) digits = `7${digits.slice(1)}`;
  if (digits.length !== 11 || !digits.startsWith('7')) return null;
  return `+${digits}`;
}

function getBearerToken(req) {
  const header = String(req.headers?.authorization || '');
  return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
}

async function requireAuth(req, res) {
  const token = getBearerToken(req);
  if (!token || token.length > 4096) {
    res.status(401).json({ ok: false, message: 'Google немесе email арқылы кіру қажет' });
    return null;
  }
  try {
    const r = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${token}`,
      },
    });
    if (!r.ok) {
      res.status(401).json({ ok: false, message: 'Сессия жарамсыз немесе мерзімі аяқталған' });
      return null;
    }
    const user = await r.json();
    if (!user?.id) {
      res.status(401).json({ ok: false, message: 'Қолданушы табылмады' });
      return null;
    }
    return user;
  } catch {
    res.status(503).json({ ok: false, message: 'Авторизация сервисіне қосылу мүмкін болмады' });
    return null;
  }
}

function noStore(res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

module.exports = { normalizePhone, getBearerToken, requireAuth, noStore };
