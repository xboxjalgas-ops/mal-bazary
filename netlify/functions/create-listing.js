// netlify/functions/create-listing.js
//
// Жаңа мал хабарландыруын дерекқорға қосады.
//
// ҚОРҒАНЫС: бұл функция ғана дерекқорға ЖАЗА алады (SUPABASE_SERVICE_ROLE_KEY
// тек осы серверлік кодта, ешқашан браузерге жіберілмейді). Клиенттен
// келген деректің бәрі осында тексеріледі (валидация) — ешбір деректі
// сенімсіз (unvalidated) күйде дерекқорға жібермейміз.

const ALLOWED_TYPES = ['Сиыр', 'Қой', 'Жылқы', 'Тауық', 'Қаз', 'Үйрек', 'Қоян'];

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

  const type = String(body.type || '').trim();
  const title = String(body.title || '').trim();
  const description = String(body.description || '').trim();
  const price = Number(body.price);
  const location = String(body.location || '').trim();
  const sellerName = String(body.seller_name || '').trim();
  const sellerPhone = String(body.seller_phone || '').trim();

  if (!ALLOWED_TYPES.includes(type)) return bad('Мал түрі қате');
  if (!title || title.length > 200) return bad('Атауы қате немесе тым ұзын');
  if (description.length > 2000) return bad('Сипаттама тым ұзын');
  if (!Number.isFinite(price) || price <= 0 || price > 1_000_000_000) return bad('Баға қате');
  if (!location || location.length > 200) return bad('Орналасқан жері қате');
  if (!sellerName || sellerName.length > 200) return bad('Аты-жөні қате');
  const phoneDigits = sellerPhone.replace(/\D/g, '');
  if (phoneDigits.length < 10) return bad('Телефон нөмірі қате');

  try {
    const url = `${process.env.SUPABASE_URL}/rest/v1/listings`;
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
          type,
          title,
          description,
          price,
          location,
          seller_name: sellerName,
          seller_phone: sellerPhone,
        },
      ]),
    });

    if (!res.ok) {
      return { statusCode: 502, body: JSON.stringify({ ok: false, message: 'Дерекқорға жазу қатесі' }) };
    }
    const data = await res.json();
    return { statusCode: 200, body: JSON.stringify({ ok: true, listing: data[0] }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, message: 'Серверде қате' }) };
  }
};
