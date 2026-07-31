// api/delete-listing.js  (Vercel serverless function)
//
// Хабарландыруды өшіреді, бірақ тек сол хабарландырудың seller_phone
// өрісі сұрауда келген phone-мен дәл сәйкес келсе ғана (иелік тексеру).

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }
  const { id, phone } = req.body || {};
  if (!id || !phone) {
    return res.status(400).json({ ok: false, message: 'Деректер жетіспейді' });
  }

  try {
    const url = `${process.env.SUPABASE_URL}/rest/v1/listings?id=eq.${encodeURIComponent(id)}&seller_phone=eq.${encodeURIComponent(phone)}`;
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
      return res.status(403).json({ ok: false, message: 'Бұл хабарландыру сізге тиесілі емес' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, message: 'Серверде қате' });
  }
};
