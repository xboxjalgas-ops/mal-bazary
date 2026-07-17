// netlify/functions/get-listings.js
//
// Барлық мал хабарландыруларын Supabase-тен алады. Тек оқу үшін —
// қауіпсіз, себебі клиентке ешбір құпия кілт берілмейді (сұрау
// толығымен серверде орындалады).

exports.handler = async () => {
  try {
    const url = `${process.env.SUPABASE_URL}/rest/v1/listings?select=*&order=created_at.desc&limit=200`;
    const res = await fetch(url, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    if (!res.ok) {
      return { statusCode: 502, body: JSON.stringify({ ok: false, message: 'Дерекқор қатесі' }) };
    }
    const data = await res.json();
    return { statusCode: 200, body: JSON.stringify({ ok: true, listings: data }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, message: 'Серверде қате' }) };
  }
};
