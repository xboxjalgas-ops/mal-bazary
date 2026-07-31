// api/get-user.js  (Vercel serverless function)
// Телефон нөмірі бойынша тіркелген қолданушыны тексереді.

module.exports = async (req, res) => {
  const phone = (req.query && req.query.phone) || '';
  if (!phone) {
    return res.status(400).json({ ok: false, message: 'Телефон жоқ' });
  }

  try {
    const url = `${process.env.SUPABASE_URL}/rest/v1/users?select=name,phone,avatar_url&phone=eq.${encodeURIComponent(phone)}`;
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
    if (data.length > 0) {
      return res.status(200).json({ ok: true, exists: true, name: data[0].name, avatar_url: data[0].avatar_url || null });
    }
    return res.status(200).json({ ok: true, exists: false });
  } catch (err) {
    return res.status(500).json({ ok: false, message: 'Серверде қате' });
  }
};
