// netlify/functions/telegram-webhook.js
//
// Telegram-нан келетін хабарламаларды қабылдайтын webhook.
// Мұны бір рет мына сілтемені браузерде ашып тіркейсің (README-ді қара):
//   https://api.telegram.org/bot<ТОКЕН>/setWebhook?url=https://<сайтың>.netlify.app/.netlify/functions/telegram-webhook
//
// Логика:
//  1) /start <sessionId> келсе — chatId мен sessionId-ды бір-біріне байлап
//     сақтаймыз, қолданушыдан "Нөмірімді бөлісу" батырмасы арқылы контакт сұраймыз.
//  2) Контакт (телефон) келсе — sessionId-ге сол телефонды жазамыз (расталды).
//  3) Frontend telegram-check.js арқылы осы sessionId-ды сұрап, растауды көреді.

const { getStore } = require('@netlify/blobs');

async function sendMessage(token, chatId, text, replyMarkup) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_markup: replyMarkup,
    }),
  });
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const store = getStore('telegram-sessions');

  let update;
  try {
    update = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 200, body: 'ok' };
  }

  const message = update.message;
  if (!message) return { statusCode: 200, body: 'ok' };
  const chatId = message.chat.id;

  // 1) /start <sessionId>
  if (message.text && message.text.startsWith('/start')) {
    const sessionId = message.text.split(' ')[1];
    if (sessionId) {
      await store.setJSON(`chat:${chatId}`, { sessionId });
      await store.setJSON(`session:${sessionId}`, { chatId, phone: null });
      await sendMessage(
        token,
        chatId,
        'Сәлеметсіз бе! "Мал Базары" сайтындағы тіркелуді растау үшін төмендегі батырманы басып, нөміріңізді бөлісіңіз.',
        {
          keyboard: [[{ text: '📱 Нөмірімді бөлісу', request_contact: true }]],
          resize_keyboard: true,
          one_time_keyboard: true,
        }
      );
    } else {
      await sendMessage(
        token,
        chatId,
        'Бұл бот "Мал Базары" сайтындағы тіркелуді растауға арналған. Сайттан "Telegram арқылы тіркелу" батырмасын басып қайта көріңіз.'
      );
    }
    return { statusCode: 200, body: 'ok' };
  }

  // 2) Контакт (телефон) бөлісу
  if (message.contact && message.contact.phone_number) {
    const chatRecord = await store.get(`chat:${chatId}`, { type: 'json' }).catch(() => null);
    const sessionId = chatRecord && chatRecord.sessionId;

    if (sessionId) {
      let phone = message.contact.phone_number;
      if (!phone.startsWith('+')) phone = '+' + phone;
      await store.setJSON(`session:${sessionId}`, { chatId, phone, verifiedAt: Date.now() });
      await sendMessage(token, chatId, '✅ Нөміріңіз расталды! Енді браузерге қайта оралып, тіркелуді аяқтаңыз.', {
        remove_keyboard: true,
      });
    } else {
      await sendMessage(token, chatId, 'Сессия табылмады. Сайттан қайта әрекеттеніп көріңіз.');
    }
    return { statusCode: 200, body: 'ok' };
  }

  return { statusCode: 200, body: 'ok' };
};
