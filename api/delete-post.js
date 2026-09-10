const { requireAuth, noStore } = require('../lib/auth');
module.exports = async (req,res)=>{
  noStore(res);
  if(req.method!=='POST')return res.status(405).json({ok:false,message:'Method not allowed'});
  const authUser=await requireAuth(req,res); if(!authUser)return;
  const {kind,id}=req.body||{};
  if(!['listing','product'].includes(kind)||!/^[0-9a-f-]{36}$/i.test(String(id||'')))return res.status(400).json({ok:false,message:'Деректер қате'});
  const common={apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`};
  try{
    const ur=await fetch(`${process.env.SUPABASE_URL}/rest/v1/users?select=phone&auth_user_id=eq.${authUser.id}&limit=1`,{headers:common});
    const users=ur.ok?await ur.json():[]; if(!users.length)return res.status(403).json({ok:false,message:'Профиль табылмады'});
    const table=kind==='product'?'products':'listings';
    const r=await fetch(`${process.env.SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}&seller_phone=eq.${encodeURIComponent(users[0].phone)}`,{method:'DELETE',headers:{...common,Prefer:'return=representation'}});
    if(!r.ok)return res.status(502).json({ok:false,message:'Өшіру қатесі'});
    const rows=await r.json(); if(!rows.length)return res.status(403).json({ok:false,message:'Бұл жарияланым сізге тиесілі емес'});
    return res.status(200).json({ok:true});
  }catch{return res.status(500).json({ok:false,message:'Серверде қате'});}
};
