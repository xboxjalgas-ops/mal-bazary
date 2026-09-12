const crypto = require('crypto');

const store = globalThis.__MB_RATE_LIMITS || (globalThis.__MB_RATE_LIMITS = new Map());
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const JSON_TYPES = ['application/json', 'application/merge-patch+json'];

function clientIp(req) {
  const raw = String(req.headers?.['x-forwarded-for'] || req.headers?.['x-real-ip'] || req.socket?.remoteAddress || 'unknown');
  return raw.split(',')[0].trim().replace(/[^\w:.%-]/g, '').slice(0, 80) || 'unknown';
}

function requestId(req) {
  const supplied = String(req.headers?.['x-request-id'] || '');
  return /^[a-zA-Z0-9._-]{8,80}$/.test(supplied) ? supplied : crypto.randomUUID();
}

function sameOrigin(req) {
  const origin = String(req.headers?.origin || '');
  if (!origin) return true;
  try {
    const url = new URL(origin);
    const host = String(req.headers?.host || '').toLowerCase();
    return url.host.toLowerCase() === host &&
      (url.protocol === 'https:' || url.hostname === 'localhost' || url.hostname === '127.0.0.1');
  } catch {
    return false;
  }
}

function securityHeaders(res, id) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cache-Control', 'no-store');
  if (id) res.setHeader('X-Request-Id', id);
}

function audit(event, req, extra = {}) {
  const entry = {
    level: event === 'allowed' ? 'info' : 'warn',
    event: `security.${event}`,
    at: new Date().toISOString(),
    requestId: req.securityRequestId,
    method: String(req.method || 'GET').toUpperCase(),
    path: String(req.url || '').split('?')[0].slice(0, 160),
    ip: clientIp(req),
    ...extra,
  };
  console[event === 'allowed' ? 'info' : 'warn'](JSON.stringify(entry));
}

function reject(req, res, status, message, reason) {
  audit('blocked', req, { status, reason });
  res.status(status).json({ ok: false, message, requestId: req.securityRequestId });
  return false;
}

function hasUnsafeKeys(value, depth = 0) {
  if (!value || typeof value !== 'object' || depth > 8) return depth > 8;
  if (Array.isArray(value)) return value.some(item => hasUnsafeKeys(item, depth + 1));
  return Object.keys(value).some(key =>
    ['__proto__', 'prototype', 'constructor'].includes(key) || hasUnsafeKeys(value[key], depth + 1)
  );
}

function protect(req, res, {
  limit = 60,
  windowMs = 60_000,
  maxBytes = 200_000,
  write = false,
  methods,
  requireJson = write,
} = {}) {
  req.securityRequestId = requestId(req);
  securityHeaders(res, req.securityRequestId);

  const method = String(req.method || 'GET').toUpperCase();
  if (Array.isArray(methods) && !methods.includes(method)) {
    res.setHeader('Allow', methods.join(', '));
    return reject(req, res, 405, 'Бұл сұрау әдісіне рұқсат жоқ', 'method');
  }

  if (write && (String(req.headers?.['sec-fetch-site'] || '') === 'cross-site' || !sameOrigin(req))) {
    return reject(req, res, 403, 'Сұрау көзіне рұқсат жоқ', 'cross-origin');
  }

  if (requireJson && !SAFE_METHODS.has(method)) {
    const type = String(req.headers?.['content-type'] || '').split(';')[0].trim().toLowerCase();
    if (type && !JSON_TYPES.includes(type)) {
      return reject(req, res, 415, 'Тек JSON сұрауына рұқсат', 'content-type');
    }
  }

  const length = Number(req.headers?.['content-length'] || 0);
  if (!Number.isFinite(length) || length < 0 || length > maxBytes) {
    return reject(req, res, 413, 'Сұрау көлемі тым үлкен', 'body-size');
  }
  if (hasUnsafeKeys(req.body) || hasUnsafeKeys(req.query)) {
    return reject(req, res, 400, 'Сұрау құрылымы қате', 'unsafe-object-key');
  }

  const now = Date.now();
  const path = String(req.url || '').split('?')[0];
  const key = `${clientIp(req)}:${method}:${path}`;
  const current = store.get(key);
  const state = !current || current.resetAt <= now ? { count: 0, resetAt: now + windowMs } : current;
  state.count += 1;
  store.set(key, state);

  res.setHeader('RateLimit-Limit', String(limit));
  res.setHeader('RateLimit-Remaining', String(Math.max(0, limit - state.count)));
  res.setHeader('RateLimit-Reset', String(Math.ceil(state.resetAt / 1000)));

  if (store.size > 5000) {
    for (const [storedKey, value] of store) if (value.resetAt <= now) store.delete(storedKey);
  }
  if (state.count > limit) {
    res.setHeader('Retry-After', String(Math.max(1, Math.ceil((state.resetAt - now) / 1000))));
    return reject(req, res, 429, 'Сұрау тым көп. Біраздан кейін қайталап көріңіз', 'rate-limit');
  }
  return true;
}

module.exports = {
  protect,
  securityHeaders,
  sameOrigin,
  clientIp,
  hasUnsafeKeys,
  requestId,
};