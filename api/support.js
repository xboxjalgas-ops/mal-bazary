const { requireAuth, isAdminEmail, noStore } = require('../lib/auth');
const {protect}=require('../lib/security');
const CATEGORIES=['Тіркелу','Хабарландыру','Сурет','Қауіпсіздік','Техникалық қате','Шағым','Басқа'];
const STATUSES=['new','in_progress','answered','closed'];
const headers=extra=>({apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,...extra});
const base=()=>`${process.env.SUPABASE_URL}/rest/v1/support_tickets`;
module.exports=async(req,res)=>{
 noStore(res);if(!protect(req,res,{write:req.method!=='GET',limit:req.method==='GET'?60:12,windowMs:600000,maxBytes:100000}))return;const authUser=await requireAuth(req,res);if(!authUser)return;
 try{
  const pr=await fetch(`${process.env.SUPABASE_URL}/rest/v1/users?select=name,email,role&auth_user_id=eq.${authUser.id}&limit=1`,{headers:headers()});
  const profiles=pr.ok?await pr.json():[];const profile=profiles[0]||{};const isAdmin=profile.role==='admin'||isAdminEmail(authUser.email);
  if(req.method==='GET'){
   const filter=isAdmin?'':`&auth_user_id=eq.${authUser.id}`;
   const r=await fetch(`${base()}?select=*&order=created_at.desc&limit=100${filter}`,{headers:headers()});
   if(!r.ok)return res.status(502).json({ok:false,message:'Өтінімдерді жүктеу қатесі'});
   return res.status(200).json({ok:true,isAdmin,tickets:await r.json()});
  }
  if(req.method==='POST'){
   const category=String(req.body?.category||''),subject=String(req.body?.subject||'').trim(),message=String(req.body?.message||'').trim();
   if(!CATEGORIES.includes(category)||subject.length<5||subject.length>120||message.length<10||message.length>2000)return res.status(400).json({ok:false,message:'Өтінім деректерін толық әрі дұрыс жазыңыз'});
   const payload={auth_user_id:authUser.id,user_name:profile.name||authUser.user_metadata?.full_name||'Қолданушы',user_email:authUser.email||profile.email||null,category,subject,message,status:'new'};
   const r=await fetch(base(),{method:'POST',headers:headers({'Content-Type':'application/json',Prefer:'return=representation'}),body:JSON.stringify([payload])});
   if(!r.ok)return res.status(502).json({ok:false,message:'Өтінімді сақтау қатесі'});return res.status(201).json({ok:true,ticket:(await r.json())[0]});
  }
  if(req.method==='PATCH'){
   if(!isAdmin)return res.status(403).json({ok:false,message:'Тек администратор жауап бере алады'});
   const id=String(req.body?.id||''),status=String(req.body?.status||''),reply=String(req.body?.admin_reply||'').trim();
   if(!/^[0-9a-f-]{36}$/i.test(id)||!STATUSES.includes(status)||reply.length>2000)return res.status(400).json({ok:false,message:'Жауап деректері қате'});
   const r=await fetch(`${base()}?id=eq.${id}`,{method:'PATCH',headers:headers({'Content-Type':'application/json',Prefer:'return=representation'}),body:JSON.stringify({status,admin_reply:reply,updated_at:new Date().toISOString()})});
   const rows=r.ok?await r.json():[];if(!rows.length)return res.status(404).json({ok:false,message:'Өтінім табылмады'});return res.status(200).json({ok:true,ticket:rows[0]});
  }
  return res.status(405).json({ok:false,message:'Method not allowed'});
 }catch{return res.status(500).json({ok:false,message:'Серверде қате'});}
};
