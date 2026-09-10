const { requireAuth, noStore } = require('../lib/auth');
const ALLOWED={
'image/jpeg':{ext:'jpg',test:b=>b[0]===0xff&&b[1]===0xd8&&b[2]===0xff},
'image/png':{ext:'png',test:b=>b.slice(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))},
'image/webp':{ext:'webp',test:b=>b.slice(0,4).toString()==='RIFF'&&b.slice(8,12).toString()==='WEBP'}};
module.exports=async(req,res)=>{
 noStore(res); if(req.method!=='POST')return res.status(405).json({ok:false,message:'Method not allowed'});
 const authUser=await requireAuth(req,res); if(!authUser)return;
 const mime=String(req.body?.mimeType||''),raw=String(req.body?.imageBase64||'').trim(),format=ALLOWED[mime];
 if(!format||!raw||raw.length>3_000_000)return res.status(400).json({ok:false,message:'JPEG, PNG немесе WEBP суретін таңдаңыз'});
 let buffer; try{buffer=Buffer.from(raw,'base64');}catch{return res.status(400).json({ok:false,message:'Сурет деректері қате'});}
 if(!buffer.length||buffer.length>2*1024*1024||!format.test(buffer))return res.status(400).json({ok:false,message:'Сурет қате немесе 2 МБ-тан үлкен'});
 try{
  const common={apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`};
  const path=`${authUser.id}.${format.ext}`,stable=`${process.env.SUPABASE_URL}/storage/v1/object/public/avatars/${path}`;
  const upload=await fetch(`${process.env.SUPABASE_URL}/storage/v1/object/avatars/${path}`,{method:'POST',headers:{...common,'Content-Type':mime,'x-upsert':'true'},body:buffer});
  if(!upload.ok)return res.status(502).json({ok:false,message:'Сурет жүктеу қатесі'});
  const update=await fetch(`${process.env.SUPABASE_URL}/rest/v1/users?auth_user_id=eq.${authUser.id}`,{method:'PATCH',headers:{...common,'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify({avatar_url:stable})});
  const rows=update.ok?await update.json():[]; if(!rows.length)return res.status(404).json({ok:false,message:'Профиль табылмады'});
  return res.status(200).json({ok:true,avatar_url:`${stable}?t=${Date.now()}`});
 }catch{return res.status(500).json({ok:false,message:'Серверде қате'});}
};
