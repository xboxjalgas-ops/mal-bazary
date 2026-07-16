// netlify/functions/telegram-check.js
//
// Frontend бұл функцияны sessionId-мен бірнеше секунд сайын шақырады
// ("polling"), қолданушы Telegram-да нөмірін бөліскенін білу үшін.

const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  const sessionId = event.queryStringParameters && event.queryStringParameters.sessionId;
  if (!sessionId) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, message: 'sessionId жоқ' }) };
  }

  const store = getStore('telegram-sessions');
  const record = await store.get(`session:${sessionId}`, { type: 'json' }).catch(() => null);

  if (record && record.phone) {
    return { statusCode: 200, body: JSON.stringify({ ok: true, verified: true, phone: record.phone }) };
  }
  return { statusCode: 200, body: JSON.stringify({ ok: true, verified: false }) };
};
