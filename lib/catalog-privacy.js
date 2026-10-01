/* Allowlist the public response so future private DB columns are not exposed. */
const { protect } = require('./security');
const COMMON = ['id','description','price','location','seller_name','seller_phone','seller_avatar','seller_auth_id','images','created_at','region','district','village','seller_verified','seller_shop_name','seller_rating','seller_review_count'];
function publicRow(row, kind) {
  const fields = [...COMMON, ...(kind === 'products' ? ['category','name'] : ['type','title','status','updated_at'])];
  const output = {};
  for (const key of fields) if (Object.hasOwn(row, key)) output[key] = row[key];
  if (kind === 'listings') {
    output.animal_details = {};
    // These fields are explicitly entered for the public listing; internal JSON keys stay private.
    for (const key of ['breed','age','weight','health','documents']) {
      const value = row.animal_details?.[key];
      if (typeof value === 'string') output.animal_details[key] = value;
    }
  }
  return output;
}
function withCatalogPrivacy(handler) {
  return async (req, res) => {
    if (!protect(req, res, { methods: ['GET'], limit: 120, windowMs: 60000 })) return;
    if (req.query?.type !== undefined && !['listings','products'].includes(req.query.type)) {
      return res.status(400).json({ ok: false, message: 'Каталог түрі қате' });
    }
    const json = res.json.bind(res);
    res.json = payload => {
      if (!payload?.ok) return json(payload);
      const kind = req.query?.type === 'products' ? 'products' : 'listings';
      return json({ ok: true, [kind]: (payload[kind] || []).map(row => publicRow(row, kind)) });
    };
    return handler(req, res);
  };
}
module.exports = { publicRow, withCatalogPrivacy };
