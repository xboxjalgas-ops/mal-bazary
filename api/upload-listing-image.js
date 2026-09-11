const crypto = require('crypto');
const { requireAuth, noStore } = require('../lib/auth');
const {protect}=require('../lib/security');
const ALLOWED={
'image/jpeg':{ext:'jpg',test:b=>b[0]===0xff&&b[1]===0xd8&&b[2]===0xff},
'image/png':{ext:'png',test:b=>b.slice(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))},
'image/webp':{ext:'webp',test:b=>b.slice(0,4).toString()==='RIFF'&&b.slice(8,12).toString()==='WEBP'}};
module.exports=async(req,res)=>{
 noStore(res);if(!protect(req,res,{write:true,limit:30,windowMs:600000,maxBytes:6500000}))return; if(req.method!=='POST')return res.status(405).json({ok:false,message:'Method not allowed'});
 const authUser=await requireAuth(req,res); if(!authUser)return;
 const mime=String(req.body?.mimeType||''),raw=String(req.body?.imageBase64||'').trim(),format=ALLOWED[mime];
 if(!format||!raw||raw.length>6_000_000)return res.status(400).json({ok:false,message:'JPEG, PNG немесе WEBP суретін таңдаңыз'});
 let buffer; try{buffer=Buffer.from(raw,'base64');}catch{return res.status(400).json({ok:false,message:'Сурет деректері қате'});}
 if(!buffer.length||buffer.length>4*1024*1024||!format.test(buffer))return res.status(400).json({ok:false,message:'Сурет қате немесе 4 МБ-тан үлкен'});
 try{
  const path=`${authUser.id}/${crypto.randomUUID()}.${format.ext}`;
  const common={apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`};
  const r=await fetch(`${process.env.SUPABASE_URL}/storage/v1/object/listing-images/${path}`,{method:'POST',headers:{...common,'Content-Type':mime,'Cache-Control':'31536000'},body:buffer});
  if(!r.ok)return res.status(502).json({ok:false,message:'Сурет жүктелмеді'});
  return res.status(201).json({ok:true,url:`${process.env.SUPABASE_URL}/storage/v1/object/public/listing-images/${path}`});
 }catch{return res.status(500).json({ok:false,message:'Серверде қате'});}
};
