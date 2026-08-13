// api/create-post.js  (Vercel serverless function)
// Бұрынғы create-listing.js + create-product.js біріктірілген нұсқасы.
// body: { kind: "listing" | "product", ...өрістер }

const ALLOWED_TYPES = ['Сиыр', 'Қой', 'Жылқы', 'Тауық', 'Қаз', 'Үйрек', 'Қоян'];
const ALLOWED_TAGS = ['tag-good', 'tag-budget', 'tag-med', 'tag-coop'];

function bad(res, message) {
  return res.status(400).json({ ok: false, message });
}

async function lookupAvatar(sellerPhone) {
  try {
    const r = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/users?select=avatar_url&phone=eq.${encodeURIComponent(sellerPhone)}`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    if (r.ok) {
      const d = await r.json();
      if (d.length > 0) return d[0].avatar_url || null;
    }
  } catch {}
  return null;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  const body = req.body || {};
  const kind = body.kind === 'product' ? 'product' : 'listing';
  const sellerName = String(body.seller_name || '').trim();
  const sellerPhone = String(body.seller_phone || '').trim();
  const location = String(body.location || '').trim();
  const description = String(body.description || '').trim();

  if (!sellerName || sellerName.length > 200) return bad(res, 'Аты-жөні қате');
  const phoneDigits = sellerPhone.replace(/\D/g, '');
  if (phoneDigits.length < 10) return bad(res, 'Телефон нөмірі қате');
  if (!location || location.length > 200) return bad(res, 'Орналасқан жері қате');
  if (description.length > 2000) return bad(res, 'Сипаттама тым ұзын');

  try {
    const sellerAvatar = await lookupAvatar(sellerPhone);

    if (kind === 'listing') {
      const type = String(body.type || '').trim();
      const title = String(body.title || '').trim();
      const price = Number(body.price);
      if (!ALLOWED_TYPES.includes(type)) return bad(res, 'Мал түрі қате');
      if (!title || title.length > 200) return bad(res, 'Атауы қате немесе тым ұзын');
      if (!Number.isFinite(price) || price <= 0 || price > 1_000_000_000) return bad(res, 'Баға қате');

      const supaRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/listings`, {
        method: 'POST',
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify([
          { type, title, description, price, location, seller_name: sellerName, seller_phone: sellerPhone, seller_avatar: sellerAvatar },
        ]),
      });
      if (!supaRes.ok) return res.status(502).json({ ok: false, message: 'Дерекқорға жазу қатесі' });
      const data = await supaRes.json();
      return res.status(200).json({ ok: true, listing: data[0] });
    }

    // kind === 'product'
    const category = String(body.category || '').trim();
    const name = String(body.name || '').trim();
    const price = String(body.price || '').trim();
    if (!ALLOWED_TAGS.includes(category)) return bad(res, 'Санат қате');
    if (!name || name.length > 200) return bad(res, 'Атауы қате немесе тым ұзын');
    if (!price || price.length > 100) return bad(res, 'Баға қате');

    const supaRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/products`, {
      method: 'POST',
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify([
        { category, name, description, price, location, seller_name: sellerName, seller_phone: sellerPhone, seller_avatar: sellerAvatar },
      ]),
    });
    if (!supaRes.ok) return res.status(502).json({ ok: false, message: 'Дерекқорға жазу қатесі' });
    const data = await supaRes.json();
    return res.status(200).json({ ok: true, product: data[0] });
  } catch (err) {
    return res.status(500).json({ ok: false, message: 'Серверде қате' });
  }
};
