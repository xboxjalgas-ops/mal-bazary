// netlify/functions/upload-avatar.js

const ALLOWED_MIME = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX_BYTES = 2 * 1024 * 1024;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return { statusCode: 400, body: JSON.stringify({ ok:false, message:'Деректер қате' }) }; }

  const phone = String(body.phone || '').trim();
  const mimeType = String(body.mimeType || '').trim();
  const imageBase64 = String(body.imageBase64 || '').trim();

  if (!phone || phone.replace(/\D/g, '').length < 10) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, message: 'Телефон қате' }) };
  }
  const ext = ALLOWED_MIME[mimeType];
  if (!ext) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, message: 'Сурет форматы қолдау таппайды (JPEG/PNG/WEBP керек)' }) };
  }
  if (!imageBase64) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, message: 'Сурет жоқ' }) };
  }

  let buffer;
  try { buffer = Buffer.from(imageBase64, 'base64'); }
  catch { return { statusCode: 400, body: JSON.stringify({ ok: false, message: 'Сурет деректері қате' }) }; }
  if (buffer.length > MAX_BYTES) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, message: 'Сурет тым үлкен (2 МБ-тан аспауы керек)' }) };
  }

  try {
    const phoneDigits = phone.replace(/\D/g, '');
    const path = `${phoneDigits}.${ext}`;
    const uploadUrl = `${process.env.SUPABASE_URL}/storage/v1/object/avatars/${path}`;

    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': mimeType,
        'x-upsert': 'true',
      },
      body: buffer,
    });
    if (!uploadRes.ok) {
      return { statusCode: 502, body: JSON.stringify({ ok: false, message: 'Сурет жүктеу қатесі' }) };
    }

    const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/avatars/${path}?t=${Date.now()}`;

    const updateRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/users?on_conflict=phone`, {
      method: 'POST',
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify([{ phone, avatar_url: publicUrl }]),
    });
    if (!updateRes.ok) {
      return { statusCode: 502, body: JSON.stringify({ ok: false, message: 'Дерекқорды жаңарту қатесі' }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, avatar_url: publicUrl }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, message: 'Серверде қате' }) };
  }
};
