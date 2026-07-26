// netlify/functions/get-user.js
exports.handler = async (event) => {
  const phone = (event.queryStringParameters && event.queryStringParameters.phone) || '';
  if (!phone) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, message: 'Телефон жоқ' }) };
  }
  try {
    const url = `${process.env.SUPABASE_URL}/rest/v1/users?select=name,phone&phone=eq.${encodeURIComponent(phone)}`;
    const res = await fetch(url, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    if (!res.ok) return { statusCode: 502, body: JSON.stringify({ ok: false, message: 'Дерекқор қатесі' }) };
    const data = await res.json();
    if (data.length > 0) {
      return { statusCode: 200, body: JSON.stringify({ ok: true, exists: true, name: data[0].name }) };
    }
    return { statusCode: 200, body: JSON.stringify({ ok: true, exists: false }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, message: 'Серверде қате' }) };
  }
};
