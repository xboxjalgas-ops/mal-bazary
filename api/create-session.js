// api/create-session.js  (Vercel serverless function)
//
// Тіркелу/кіру сәтті болған соң шақырылады. Ұзақ мерзімді (30 күн)
// қолтаңбаланған "сессия токенін" қайтарады — оны frontend
// localStorage-ке сақтайды, келесі жолы қайта Telegram арқылы
// растаудың қажеті болмайды.

const crypto = require('crypto');

function sign(payload) {
  return crypto
    .createHmac('sha256', process.env.OTP_SECRET)
    .update(payload)
    .digest('hex');
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }
  const phone = String((req.body || {}).phone || '').trim();
  if (!phone) {
    return res.status(400).json({ ok: false, message: 'Телефон жоқ' });
  }

  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 күн
  const payload = `session:${phone}:${expiresAt}`;
  const signature = sign(payload);
  const token = Buffer.from(`${payload}:${signature}`).toString('base64');

  return res.status(200).json({ ok: true, token });
};
