// netlify/functions/telegram-start.js
//
// Браузерден "Telegram арқылы тіркелу" басылғанда шақырылады.
// Кездейсоқ session ID қайтарады — соны frontend Telegram deep-link-іне
// қосады: https://t.me/<BOT_USERNAME>?start=<sessionId>

const crypto = require('crypto');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }
  const sessionId = crypto.randomBytes(8).toString('hex');
  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, sessionId }),
  };
};
