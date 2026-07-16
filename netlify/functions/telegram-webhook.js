// netlify/functions/telegram-webhook.js
//
// Telegram-нан келетін хабарламаларды қабылдайтын webhook.
//
// Дерекқор (Netlify Blobs, т.б.) КЕРЕК ЕМЕС: қолданушы нөмірін бөліскен
// соң, біз бірден сол телефон+мерзім+құпия қолтаңбасы (HMAC) бар
// "растау коды" жасап, соны тікелей Telegram хабарламасы ретінде
// қайтарамыз. Қолданушы сол кодты сайтқа көшіріп қойғанда,
// telegram-verify.js осы қолтаңбаны қайта есептеп салыстырады —
// ешбір деректі серверде сақтаудың қажеті жоқ.

const crypto = require('crypto');

function sign(payload) {
  return crypto
    .createHmac('sha256', process.env.OTP_SECRET)
    .update(payload)
    .digest('hex');
}

async function sendMessage(token, chatId, text, replyMarkup) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, reply_markup: replyMarkup }),
  });
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  let update;
  try {
    update = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 200, body: 'ok' };
  }

  const message = update.message;
  if (!message) return { statusCode: 200, body: 'ok' };
  const chatId = message.chat.id;

  // /start келгенде — контакт бөлісуді сұраймыз
  if (message.text && message.text.startsWith('/start')) {
    await sendMessage(
      botToken,
      chatId,
      'Сәлеметсіз бе! "Мал Базары" сайтындағы тіркелуді растау үшін төмендегі батырманы басып, нөміріңізді бөлісіңіз.',
      {
        keyboard: [[{ text: '📱 Нөмірімді бөлісу', request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      }
    );
    return { statusCode: 200, body: 'ok' };
  }

  // Контакт (телефон) бөлісілгенде — растау кодын генерациялап жібереміз
  if (message.contact && message.contact.phone_number) {
    let phone = message.contact.phone_number;
    if (!phone.startsWith('+')) phone = '+' + phone;

    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 минут жарамды
    const payload = `${phone}:${expiresAt}`;
    const signature = sign(payload);
    const regCode = Buffer.from(`${payload}:${signature}`).toString('base64');

    await sendMessage(
      botToken,
      chatId,
      `✅ Нөміріңіз расталды: ${phone}\n\nТіркеуді аяқтау үшін төмендегі кодты көшіріп алып, сайттағы өріске қойыңыз (10 минут жарамды):\n\n${regCode}`,
      { remove_keyboard: true }
    );
    return { statusCode: 200, body: 'ok' };
  }

  return { statusCode: 200, body: 'ok' };
};
