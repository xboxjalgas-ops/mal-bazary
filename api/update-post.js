const { requireAuth, isAdminEmail, noStore } = require('../lib/auth');
const {protect}=require('../lib/security');
const TYPES=['Сиыр','Қой','Жылқы','Тауық','Қаз','Үйрек','Қоян'];
const headers=extra=>({apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,...extra});
const validImages=images=>Array.isArray(images)&&images.length<=8&&images.every(x=>typeof x==='string'&&x.length<700&&x.startsWith(`${process.env.SUPABASE_URL}/storage/v1/object/public/listing-images/`));
module.exports=async(req,res)=>{
 noStore(res);if(!protect(req,res,{write:true,limit:20,windowMs:600000,maxBytes:6500000}))return; if(req.method!=='POST')return res.status(405).json({ok:false,message:'Method not allowed'});
 const authUser=await requireAuth(req,res); if(!authUser)return;
 const b=req.body||{},id=String(b.id||''); if(!/^[0-9a-f-]{36}$/i.test(id))return res.status(400).json({ok:false,message:'ID қате'});
 try{
  const ur=await fetch(`${process.env.SUPABASE_URL}/rest/v1/users?select=phone,role,blocked&auth_user_id=eq.${authUser.id}&limit=1`,{headers:headers()});
  const users=ur.ok?await ur.json():[]; if(!users.length)return res.status(403).json({ok:false,message:'Профиль табылмады'});if(users[0].blocked)return res.status(403).json({ok:false,message:'Аккаунтыңыз бұғатталған'});
  const patch={updated_at:new Date().toISOString()};
  if(b.status!==undefined){if(!['active','sold'].includes(b.status))return res.status(400).json({ok:false,message:'Статус қате'});patch.status=b.status;}
  if(b.title!==undefined){
   const title=String(b.title||'').trim(),description=String(b.description||'').trim(),location=String(b.location||'').trim(),type=String(b.type||''),price=Number(b.price);
   if(title.length<3||title.length>120||description.length>1500||location.length<2||location.length>120||!TYPES.includes(type)||!Number.isFinite(price)||price<=0||price>1_000_000_000)return res.status(400).json({ok:false,message:'Хабарландыру деректері қате'});
   if(!validImages(b.images||[]))return res.status(400).json({ok:false,message:'Суреттер тізімі қате'});
   const region=String(b.region||'').trim().slice(0,80),district=String(b.district||'').trim().slice(0,100),village=String(b.village||'').trim().slice(0,100),d=b.animal_details||{};const animal_details={breed:String(d.breed||'').slice(0,80),age:String(d.age||'').slice(0,50),weight:String(d.weight||'').slice(0,50),health:String(d.health||'').slice(0,120),documents:String(d.documents||'').slice(0,300)};Object.assign(patch,{title,description,location,type,price,region,district,village,images:b.images||[],animal_details});
  }
  if(Object.keys(patch).length===1)return res.status(400).json({ok:false,message:'Өзгеріс жоқ'});
  const isAdmin=users[0].role==='admin'||isAdminEmail(authUser.email);if(!isAdmin&&b.status===undefined)patch.moderation_status='pending';
  const filter=isAdmin?`id=eq.${encodeURIComponent(id)}`:`id=eq.${encodeURIComponent(id)}&seller_phone=eq.${encodeURIComponent(users[0].phone)}`;
  const r=await fetch(`${process.env.SUPABASE_URL}/rest/v1/listings?${filter}`,{method:'PATCH',headers:headers({'Content-Type':'application/json',Prefer:'return=representation'}),body:JSON.stringify(patch)});
  if(!r.ok)return res.status(502).json({ok:false,message:'Жаңарту қатесі'});const rows=await r.json();
  if(!rows.length)return res.status(403).json({ok:false,message:'Бұл хабарландыру сізге тиесілі емес'});
  return res.status(200).json({ok:true,listing:rows[0]});
 }catch{return res.status(500).json({ok:false,message:'Серверде қате'});}
};
