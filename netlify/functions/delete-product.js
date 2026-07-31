// netlify/functions/delete-product.js
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return { statusCode: 400, body: JSON.stringify({ ok:false, message:'Деректер қате' }) }; }
  const { id, phone } = body;
  if (!id || !phone) return { statusCode: 400, body: JSON.stringify({ ok: false, message: 'Деректер жетіспейді' }) };

  try {
    const url = `${process.env.SUPABASE_URL}/rest/v1/products?id=eq.${encodeURIComponent(id)}&seller_phone=eq.${encodeURIComponent(phone)}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: 'return=representation',
      },
    });
    if (!res.ok) return { statusCode: 502, body: JSON.stringify({ ok: false, message: 'Өшіру қатесі' }) };
    const data = await res.json();
    if (data.length === 0) return { statusCode: 403, body: JSON.stringify({ ok: false, message: 'Бұл өнім сізге тиесілі емес' }) };
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, message: 'Серверде қате' }) };
  }
};
