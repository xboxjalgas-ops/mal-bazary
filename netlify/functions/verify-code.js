// netlify/functions/verify-code.js
//
// Клиенттен келген {token, code} жұбын тексереді.
// token — send-code.js берген, ішінде телефон+код+мерзім+қолтаңба бар.

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

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { token, code } = JSON.parse(event.body || '{}');
    if (!token || !code) {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, message: 'Деректер жетіспейді' }),
      };
    }

    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 4) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, message: 'Token жарамсыз' }) };
    }
    const [phone, realCode, expiresAt, signature] = parts;
    const payload = `${phone}:${realCode}:${expiresAt}`;
    const expectedSignature = sign(payload);

    if (!safeEqual(signature, expectedSignature)) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, message: 'Token жарамсыз' }) };
    }
    if (Date.now() > Number(expiresAt)) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, message: 'Кодтың мерзімі өтті, қайта сұраңыз' }) };
    }
    if (String(code).trim() !== realCode) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, message: 'Код қате' }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, phone }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, message: 'Серверде қате пайда болды' }) };
  }
};
