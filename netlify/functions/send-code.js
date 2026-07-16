// netlify/functions/send-code.js
//
// Телефон нөміріне 4 таңбалы растау коды бар SMS жібереді (Mobizon.kz арқылы).
// Дерекқор керек емес: кодты серверде сақтаудың орнына, кодтың өзін
// (қолданушыға ЕМЕС) құпия сөзбен (HMAC) қол қойылған "token" ретінде
// клиентке қайтарамыз. Растау кезінде сол token қайта тексеріледі.
//
// Қажет ортадан алынатын айнымалылар (Netlify → Site settings → Environment variables):
//   MOBIZON_API_KEY  — mobizon.kz жеке кабинетіндегі API кілт
//   OTP_SECRET       — өзің ойлап тапқан кез келген ұзын құпия жол (мыс. 40+ таңба)

const crypto = require('crypto');

const CODE_TTL_MS = 5 * 60 * 1000; // код 5 минут жарамды

function sign(payload) {
  return crypto
    .createHmac('sha256', process.env.OTP_SECRET)
    .update(payload)
    .digest('hex');
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { phone } = JSON.parse(event.body || '{}');
    const digits = (phone || '').replace(/\D/g, '');

    if (digits.length < 11) {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, message: 'Телефон нөмірі толық емес' }),
      };
    }

    const code = String(Math.floor(1000 + Math.random() * 9000)); // 4 сандық код
    const expiresAt = Date.now() + CODE_TTL_MS;
    const payload = `${digits}:${code}:${expiresAt}`;
    const signature = sign(payload);
    const token = Buffer.from(`${payload}:${signature}`).toString('base64');

    // --- Mobizon.kz арқылы SMS жіберу ---
    const params = new URLSearchParams({
      apiKey: process.env.MOBIZON_API_KEY,
      recipient: digits,
      text: `Мал Базары: растау кодыңыз - ${code}`,
      output: 'json',
    });

    const resp = await fetch(
      `https://api.mobizon.kz/service/message/sendsmsmessage?${params.toString()}`
    );
    const data = await resp.json();

    if (data.code !== 0) {
      // Mobizon қате қайтарса (баланс жетіспесе, нөмір қате форматта болса, т.б.)
      return {
        statusCode: 502,
        body: JSON.stringify({
          ok: false,
          message: 'SMS жіберілмеді: ' + (data.message || 'белгісіз қате'),
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, token }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, message: 'Серверде қате пайда болды' }),
    };
  }
};
