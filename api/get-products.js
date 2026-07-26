// api/get-products.js  (Vercel serverless function)

module.exports = async (req, res) => {
  try {
    const url = `${process.env.SUPABASE_URL}/rest/v1/products?select=*&order=created_at.desc&limit=200`;
    const supaRes = await fetch(url, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    if (!supaRes.ok) {
      return res.status(502).json({ ok: false, message: 'Дерекқор қатесі' });
    }
    const data = await supaRes.json();
    return res.status(200).json({ ok: true, products: data });
  } catch (err) {
    return res.status(500).json({ ok: false, message: 'Серверде қате' });
  }
};
