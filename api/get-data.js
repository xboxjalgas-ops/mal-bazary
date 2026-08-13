// api/get-data.js  (Vercel serverless function)
// Бұрынғы get-listings.js + get-products.js біріктірілген нұсқасы
// (Vercel Hobby жоспарында ең көбі 12 функция болатындықтан).
// Қолданылуы: GET /api/get-data?type=listings  немесе  ?type=products

module.exports = async (req, res) => {
  const type = (req.query && req.query.type) || 'listings';
  const table = type === 'products' ? 'products' : 'listings';

  try {
    const url = `${process.env.SUPABASE_URL}/rest/v1/${table}?select=*&order=created_at.desc&limit=200`;
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
    if (table === 'products') {
      return res.status(200).json({ ok: true, products: data });
    }
    return res.status(200).json({ ok: true, listings: data });
  } catch (err) {
    return res.status(500).json({ ok: false, message: 'Серверде қате' });
  }
};
