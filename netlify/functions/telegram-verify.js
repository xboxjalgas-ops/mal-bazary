// netlify/functions/telegram-verify.js
//
// Қолданушы Telegram bot-тан алған кодты сайтқа қойғанда шақырылады.
// Дерекқорсыз тексереді: кодтың ішіндегі қолтаңбаны қайта есептеп,
// сай келсе әрі мерзімі өтпесе — телефон нөмірін растап қайтарады.

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
    const { token } = JSON.parse(event.body || '{}');
    if (!token) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, message: 'Код жоқ' }) };
    }

    const decoded = Buffer.from(token.trim(), 'base64').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 3) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, message: 'Код жарамсыз' }) };
    }
    const [phone, expiresAt, signature] = parts;
    const payload = `${phone}:${expiresAt}`;
    const expectedSignature = sign(payload);

    if (!safeEqual(signature, expectedSignature)) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, message: 'Код жарамсыз' }) };
    }
    if (Date.now() > Number(expiresAt)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, message: 'Кодтың мерзімі өтті, Telegram-нан қайта сұраңыз' }),
      };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, phone }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, message: 'Серверде қате пайда болды' }) };
  }
};
