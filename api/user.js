// api/user.js  (Vercel serverless function)
// Бұрынғы get-user.js + create-user.js біріктірілген нұсқасы.
// GET /api/user?phone=...           — тексеру
// POST /api/user  {phone, name}     — тіркеу/жаңарту

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const phone = (req.query && req.query.phone) || '';
    if (!phone) return res.status(400).json({ ok: false, message: 'Телефон жоқ' });
    try {
      const url = `${process.env.SUPABASE_URL}/rest/v1/users?select=name,phone,avatar_url&phone=eq.${encodeURIComponent(phone)}`;
      const supaRes = await fetch(url, {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      });
      if (!supaRes.ok) return res.status(502).json({ ok: false, message: 'Дерекқор қатесі' });
      const data = await supaRes.json();
      if (data.length > 0) {
        return res.status(200).json({ ok: true, exists: true, name: data[0].name, avatar_url: data[0].avatar_url || null });
      }
      return res.status(200).json({ ok: true, exists: false });
    } catch (err) {
      return res.status(500).json({ ok: false, message: 'Серверде қате' });
    }
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const phone = String(body.phone || '').trim();
    const name = String(body.name || '').trim();
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ ok: false, message: 'Телефон қате' });
    }
    if (!name || name.length > 200) {
      return res.status(400).json({ ok: false, message: 'Аты-жөні қате' });
    }
    try {
      const url = `${process.env.SUPABASE_URL}/rest/v1/users?on_conflict=phone`;
      const supaRes = await fetch(url, {
        method: 'POST',
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=representation',
        },
        body: JSON.stringify([{ phone, name }]),
      });
      if (!supaRes.ok) return res.status(502).json({ ok: false, message: 'Дерекқорға жазу қатесі' });
      const data = await supaRes.json();
      return res.status(200).json({ ok: true, name: data[0].name, phone: data[0].phone });
    } catch (err) {
      return res.status(500).json({ ok: false, message: 'Серверде қате' });
    }
  }

  return res.status(405).send('Method not allowed');
};
