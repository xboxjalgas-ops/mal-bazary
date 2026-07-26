// api/telegram-webhook.js  (Vercel serverless function)
//
// Telegram-нан келетін хабарламаларды қабылдайтын webhook.
// Дерекқор керек емес: контакт бөлісілгенде HMAC-пен қол қойылған
// "растау коды" тікелей Telegram хабарламасы ретінде жіберіледі.

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

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const update = req.body || {};
  const message = update.message;
  if (!message) return res.status(200).send('ok');
  const chatId = message.chat.id;

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
    return res.status(200).send('ok');
  }

  if (message.contact && message.contact.phone_number) {
    let phone = message.contact.phone_number;
    if (!phone.startsWith('+')) phone = '+' + phone;

    const expiresAt = Date.now() + 10 * 60 * 1000;
    const payload = `${phone}:${expiresAt}`;
    const signature = sign(payload);
    const regCode = Buffer.from(`${payload}:${signature}`).toString('base64');

    await sendMessage(
      botToken,
      chatId,
      `✅ Нөміріңіз расталды: ${phone}\n\nТіркеуді аяқтау үшін төмендегі кодты көшіріп алып, сайттағы өріске қойыңыз (10 минут жарамды):\n\n${regCode}`,
      { remove_keyboard: true }
    );
    return res.status(200).send('ok');
  }

  return res.status(200).send('ok');
};
