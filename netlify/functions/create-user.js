// netlify/functions/create-user.js
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return { statusCode: 400, body: JSON.stringify({ ok:false, message:'Деректер қате' }) }; }

  const phone = String(body.phone || '').trim();
  const name = String(body.name || '').trim();
  if (!phone || phone.replace(/\D/g, '').length < 10) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, message: 'Телефон қате' }) };
  }
  if (!name || name.length > 200) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, message: 'Аты-жөні қате' }) };
  }

  try {
    const url = `${process.env.SUPABASE_URL}/rest/v1/users?on_conflict=phone`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify([{ phone, name }]),
    });
    if (!res.ok) return { statusCode: 502, body: JSON.stringify({ ok: false, message: 'Дерекқорға жазу қатесі' }) };
    const data = await res.json();
    return { statusCode: 200, body: JSON.stringify({ ok: true, name: data[0].name, phone: data[0].phone }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, message: 'Серверде қате' }) };
  }
};
