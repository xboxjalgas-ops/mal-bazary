const { requireAuth, noStore } = require('../lib/auth');
module.exports = async (req, res) => {
  noStore(res);
  if (req.method !== 'GET') return res.status(405).json({ ok: false, message: 'Method not allowed' });
  const authUser = await requireAuth(req, res); if (!authUser) return;
  return res.status(200).json({ ok: true, id: authUser.id, email: authUser.email || null });
};
