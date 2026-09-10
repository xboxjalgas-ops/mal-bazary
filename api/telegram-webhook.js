const crypto = require('crypto');
const { normalizePhone, sign, safeEqual, noStore } = require('../lib/auth');

async function sendMessage(token, chatId, text, replyMarkup) {
  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text, reply_markup: replyMarkup }) });
  if (!r.ok) throw new Error('Telegram sendMessage failed');
}
function validWebhookSecret(req) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  const actual = String(req.headers?.['x-telegram-bot-api-secret-token'] || '');
  if (!expected || !actual) return false;
  const a = crypto.createHash('sha256').update(actual).digest('hex');
  const b = crypto.createHash('sha256').update(expected).digest('hex');
  return safeEqual(a, b);
}
module.exports = async (req, res) => {
  noStore(res);
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');
  if (!validWebhookSecret(req)) return res.status(401).send('Unauthorized');
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return res.status(503).send('Bot is not configured');
  try {
    const message = req.body?.message;
    if (!message?.chat?.id) return res.status(200).send('ok');
    const chatId = message.chat.id;
    if (message.text?.startsWith('/start')) {
      await sendMessage(botToken, chatId, 'Сәлеметсіз бе! «Мал Базары» сайтындағы тіркелуді растау үшін төмендегі батырманы басып, өз нөміріңізді бөлісіңіз.', { keyboard: [[{ text: '📱 Нөмірімді бөлісу', request_contact: true }]], resize_keyboard: true, one_time_keyboard: true });
    } else if (message.contact?.phone_number) {
      if (!message.from?.id || String(message.contact.user_id || '') !== String(message.from.id)) {
        await sendMessage(botToken, chatId, 'Тек өз Telegram нөміріңізді бөлісуге болады.', { remove_keyboard: true });
        return res.status(200).send('ok');
      }
      const phone = normalizePhone(message.contact.phone_number);
      if (!phone) { await sendMessage(botToken, chatId, 'Қазақстандық телефон нөмірінің форматы қате.', { remove_keyboard: true }); return res.status(200).send('ok'); }
      const expiresAt = Date.now() + 10 * 60 * 1000;
      const payload = `${phone}:${expiresAt}`;
      const regCode = Buffer.from(`${payload}:${sign(payload)}`).toString('base64');
      await sendMessage(botToken, chatId, `✅ Нөміріңіз расталды: ${phone}\n\nКодты сайтқа қойыңыз (10 минут жарамды):\n\n${regCode}`, { remove_keyboard: true });
    }
    return res.status(200).send('ok');
  } catch { return res.status(500).send('Server error'); }
};
