// netlify/functions/create-product.js

const ALLOWED_TAGS = ['tag-good', 'tag-budget', 'tag-med', 'tag-coop'];

function bad(message) {
  return { statusCode: 400, body: JSON.stringify({ ok: false, message }) };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return bad('Деректер қате форматта');
  }

  const category = String(body.category || '').trim();
  const name = String(body.name || '').trim();
  const description = String(body.description || '').trim();
  const price = String(body.price || '').trim();
  const location = String(body.location || '').trim();
  const sellerName = String(body.seller_name || '').trim();
  const sellerPhone = String(body.seller_phone || '').trim();

  if (!ALLOWED_TAGS.includes(category)) return bad('Санат қате');
  if (!name || name.length > 200) return bad('Атауы қате немесе тым ұзын');
  if (description.length > 2000) return bad('Сипаттама тым ұзын');
  if (!price || price.length > 100) return bad('Баға қате');
  if (!location || location.length > 200) return bad('Орналасқан жері қате');
  if (!sellerName || sellerName.length > 200) return bad('Аты-жөні қате');
  const phoneDigits = sellerPhone.replace(/\D/g, '');
  if (phoneDigits.length < 10) return bad('Телефон нөмірі қате');

  try {
    let sellerAvatar = null;
    try {
      const userLookup = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/users?select=avatar_url&phone=eq.${encodeURIComponent(sellerPhone)}`,
        {
          headers: {
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
        }
      );
      if (userLookup.ok) {
        const userData = await userLookup.json();
        if (userData.length > 0) sellerAvatar = userData[0].avatar_url || null;
      }
    } catch { /* аватар табылмаса, жоқтың есебінде жалғастырамыз */ }

    const url = `${process.env.SUPABASE_URL}/rest/v1/products`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify([
        {
          category,
          name,
          description,
          price,
          location,
          seller_name: sellerName,
          seller_phone: sellerPhone,
          seller_avatar: sellerAvatar,
        },
      ]),
    });

    if (!res.ok) {
      return { statusCode: 502, body: JSON.stringify({ ok: false, message: 'Дерекқорға жазу қатесі' }) };
    }
    const data = await res.json();
    return { statusCode: 200, body: JSON.stringify({ ok: true, product: data[0] }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, message: 'Серверде қате' }) };
  }
};
