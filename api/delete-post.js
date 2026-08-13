// api/delete-post.js  (Vercel serverless function)
// body: { kind: "listing" | "product", id, phone }

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }
  const { kind, id, phone } = req.body || {};
  if (!id || !phone) {
    return res.status(400).json({ ok: false, message: 'Деректер жетіспейді' });
  }
  const table = kind === 'product' ? 'products' : 'listings';

  try {
    const url = `${process.env.SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}&seller_phone=eq.${encodeURIComponent(phone)}`;
    const supaRes = await fetch(url, {
      method: 'DELETE',
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: 'return=representation',
      },
    });
    if (!supaRes.ok) {
      return res.status(502).json({ ok: false, message: 'Өшіру қатесі' });
    }
    const data = await supaRes.json();
    if (data.length === 0) {
      return res.status(403).json({ ok: false, message: 'Бұл сізге тиесілі емес' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, message: 'Серверде қате' });
  }
};
