// api/create-listing.js  (Vercel serverless function)

const ALLOWED_TYPES = ['Сиыр', 'Қой', 'Жылқы', 'Тауық', 'Қаз', 'Үйрек', 'Қоян'];

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  const body = req.body || {};
  const type = String(body.type || '').trim();
  const title = String(body.title || '').trim();
  const description = String(body.description || '').trim();
  const price = Number(body.price);
  const location = String(body.location || '').trim();
  const sellerName = String(body.seller_name || '').trim();
  const sellerPhone = String(body.seller_phone || '').trim();

  const bad = (message) => res.status(400).json({ ok: false, message });

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
    const supaRes = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify([
        { type, title, description, price, location, seller_name: sellerName, seller_phone: sellerPhone },
      ]),
    });

    if (!supaRes.ok) {
      return res.status(502).json({ ok: false, message: 'Дерекқорға жазу қатесі' });
    }
    const data = await supaRes.json();
    return res.status(200).json({ ok: true, listing: data[0] });
  } catch (err) {
    return res.status(500).json({ ok: false, message: 'Серверде қате' });
  }
};
