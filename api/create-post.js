const { requireAuth, noStore } = require('../lib/auth');
const ALLOWED_TYPES = ['Сиыр', 'Қой', 'Жылқы', 'Тауық', 'Қаз', 'Үйрек', 'Қоян'];
const ALLOWED_TAGS = ['tag-good', 'tag-budget', 'tag-med', 'tag-coop'];
const headers = extra => ({ apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`, ...extra });
const bad = (res, message) => res.status(400).json({ ok: false, message });
module.exports = async (req, res) => {
  noStore(res);
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed' });
  const authUser = await requireAuth(req, res); if (!authUser) return;
  const body = req.body || {}, kind = body.kind;
  if (!['listing','product'].includes(kind)) return bad(res, 'Жарияланым түрі қате');
  const location = String(body.location || '').trim(), description = String(body.description || '').trim();
  if (!location || location.length > 120) return bad(res, 'Орналасқан жері қате');
  if (description.length > 1500) return bad(res, 'Сипаттама тым ұзын');
  try {
    const ur = await fetch(`${process.env.SUPABASE_URL}/rest/v1/users?select=name,phone,avatar_url&auth_user_id=eq.${authUser.id}&limit=1`, { headers: headers() });
    if (!ur.ok) return res.status(502).json({ ok:false, message:'Дерекқор қатесі' });
    const users = await ur.json();
    if (!users.length) return res.status(403).json({ ok:false, message:'Алдымен профильді толтырыңыз' });
    const seller = users[0]; let table, record;
    if (kind === 'listing') {
      const type=String(body.type||'').trim(), title=String(body.title||'').trim(), price=Number(body.price);
      if (!ALLOWED_TYPES.includes(type)) return bad(res,'Мал түрі қате');
      if (title.length<3 || title.length>120) return bad(res,'Атауы 3–120 таңба болуы керек');
      if (!Number.isFinite(price)||price<=0||price>1_000_000_000) return bad(res,'Баға қате');
      table='listings'; record={type,title,description,price,location,seller_name:seller.name,seller_phone:seller.phone,seller_avatar:seller.avatar_url||null};
    } else {
      const category=String(body.category||'').trim(), name=String(body.name||'').trim(), price=String(body.price||'').trim();
      if (!ALLOWED_TAGS.includes(category)) return bad(res,'Санат қате');
      if (name.length<3 || name.length>120) return bad(res,'Атауы 3–120 таңба болуы керек');
      if (!price || price.length>60) return bad(res,'Баға қате');
      table='products'; record={category,name,description,price,location,seller_name:seller.name,seller_phone:seller.phone,seller_avatar:seller.avatar_url||null};
    }
    const r=await fetch(`${process.env.SUPABASE_URL}/rest/v1/${table}`,{method:'POST',headers:headers({'Content-Type':'application/json',Prefer:'return=representation'}),body:JSON.stringify([record])});
    if(!r.ok)return res.status(502).json({ok:false,message:'Дерекқорға жазу қатесі'});
    const data=await r.json(); return res.status(201).json({ok:true,[kind]:data[0]});
  } catch { return res.status(500).json({ok:false,message:'Серверде қате'}); }
};
