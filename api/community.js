const { requireAuth, isAdminEmail, noStore } = require('../lib/auth');
const H = extra => ({apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,...extra});
const root = () => `${process.env.SUPABASE_URL}/rest/v1`;
const idOk = x => /^[0-9a-f-]{36}$/i.test(String(x||''));
const jsonHeaders = {'Content-Type':'application/json',Prefer:'return=representation'};
async function rows(path, options={}){const r=await fetch(`${root()}${path}`,{...options,headers:H(options.headers||{})});if(!r.ok)throw new Error(await r.text());return r.status===204?[]:r.json();}
async function profile(uid){return (await rows(`/users?select=*&auth_user_id=eq.${uid}&limit=1`))[0]||null;}
async function listing(id){return (await rows(`/listings?select=*&id=eq.${id}&limit=1`))[0]||null;}
async function conversation(id,uid){return (await rows(`/conversations?select=*&id=eq.${id}&or=(buyer_id.eq.${uid},seller_id.eq.${uid})&limit=1`))[0]||null;}
module.exports=async(req,res)=>{
 noStore(res); const auth=await requireAuth(req,res); if(!auth)return;
 try{
  const me=await profile(auth.id); if(!me)return res.status(403).json({ok:false,message:'Алдымен профильді толтырыңыз'});
  const mode=String(req.query?.mode||req.body?.action||'inbox');
  if(req.method==='GET'&&mode==='inbox'){
   const conv=await rows(`/conversations?select=*&or=(buyer_id.eq.${auth.id},seller_id.eq.${auth.id})&order=updated_at.desc&limit=100`);
   const msgs=conv.length?await rows(`/messages?select=*&conversation_id=in.(${conv.map(x=>x.id).join(',')})&order=created_at.desc&limit=300`):[];
   const offers=await rows(`/offers?select=*&or=(buyer_id.eq.${auth.id},seller_id.eq.${auth.id})&order=created_at.desc&limit=100`);
   const reservations=await rows(`/reservations?select=*&or=(buyer_id.eq.${auth.id},seller_id.eq.${auth.id})&order=created_at.desc&limit=100`);
   return res.json({ok:true,me_id:auth.id,conversations:conv,messages:msgs,offers,reservations});
  }
  if(req.method==='GET'&&mode==='messages'){
   const cid=String(req.query?.conversation_id||''); if(!idOk(cid))return res.status(400).json({ok:false,message:'Чат ID қате'});
   const c=await conversation(cid,auth.id);if(!c)return res.status(403).json({ok:false,message:'Бұл чатқа рұқсат жоқ'});
   const messages=await rows(`/messages?select=*&conversation_id=eq.${cid}&order=created_at.asc&limit=300`);
   await rows(`/messages?conversation_id=eq.${cid}&sender_id=neq.${auth.id}&read_at=is.null`,{method:'PATCH',headers:jsonHeaders,body:JSON.stringify({read_at:new Date().toISOString()})});
   return res.json({ok:true,me_id:auth.id,conversation:c,messages});
  }
  if(req.method==='GET'&&mode==='seller'){
   const sid=String(req.query?.seller_id||'');if(!idOk(sid))return res.status(400).json({ok:false,message:'Сатушы ID қате'});
   const seller=await profile(sid);if(!seller)return res.status(404).json({ok:false,message:'Сатушы табылмады'});
   const reviews=await rows(`/reviews?select=*&seller_id=eq.${sid}&order=created_at.desc&limit=100`);
   const active=await rows(`/listings?select=id,title,price,status,images&seller_auth_id=eq.${sid}&order=created_at.desc&limit=50`);
   const avg=reviews.length?reviews.reduce((s,x)=>s+Number(x.rating),0)/reviews.length:0;
   return res.json({ok:true,seller:{auth_user_id:seller.auth_user_id,name:seller.name,avatar_url:seller.avatar_url,shop_name:seller.shop_name||'',bio:seller.bio||'',verified:Boolean(seller.verified),rating:Number(avg.toFixed(1)),review_count:reviews.length},reviews,listings:active});
  }
  if(req.method==='POST'&&mode==='start_chat'){
   const lid=String(req.body?.listing_id||'');if(!idOk(lid))return res.status(400).json({ok:false,message:'Хабарландыру ID қате'});
   const l=await listing(lid);if(!l||!l.seller_auth_id)return res.status(404).json({ok:false,message:'Хабарландыру табылмады'});
   if(l.seller_auth_id===auth.id)return res.status(400).json({ok:false,message:'Өзіңізге хат жаза алмайсыз'});
   let found=await rows(`/conversations?select=*&listing_id=eq.${lid}&buyer_id=eq.${auth.id}&seller_id=eq.${l.seller_auth_id}&limit=1`);
   if(!found.length)found=await rows('/conversations',{method:'POST',headers:jsonHeaders,body:JSON.stringify([{listing_id:lid,listing_title:l.title,buyer_id:auth.id,buyer_name:me.name,seller_id:l.seller_auth_id,seller_name:l.seller_name}])});
   return res.status(201).json({ok:true,me_id:auth.id,conversation:found[0]});
  }
  if(req.method==='POST'&&mode==='send_message'){
   const cid=String(req.body?.conversation_id||''),body=String(req.body?.message||'').trim();if(!idOk(cid)||body.length<1||body.length>1500)return res.status(400).json({ok:false,message:'Хабарлама 1–1500 таңба болуы керек'});
   const c=await conversation(cid,auth.id);if(!c)return res.status(403).json({ok:false,message:'Бұл чатқа рұқсат жоқ'});
   const m=(await rows('/messages',{method:'POST',headers:jsonHeaders,body:JSON.stringify([{conversation_id:cid,sender_id:auth.id,sender_name:me.name,body}])}))[0];
   await rows(`/conversations?id=eq.${cid}`,{method:'PATCH',headers:jsonHeaders,body:JSON.stringify({updated_at:new Date().toISOString()})});
   return res.status(201).json({ok:true,message:m});
  }
  if(req.method==='POST'&&mode==='make_offer'){
   const lid=String(req.body?.listing_id||''),amount=Number(req.body?.amount);const l=await listing(lid);
   if(!l||!l.seller_auth_id||l.seller_auth_id===auth.id||!Number.isFinite(amount)||amount<=0||amount>1e9)return res.status(400).json({ok:false,message:'Баға ұсынысы қате'});
   const o=await rows('/offers?on_conflict=listing_id,buyer_id',{method:'POST',headers:H({...jsonHeaders,Prefer:'resolution=merge-duplicates,return=representation'}),body:JSON.stringify([{listing_id:lid,listing_title:l.title,buyer_id:auth.id,buyer_name:me.name,seller_id:l.seller_auth_id,amount,status:'pending',updated_at:new Date().toISOString()}])});
   return res.status(201).json({ok:true,offer:o[0]});
  }
  if(req.method==='POST'&&mode==='reserve'){
   const lid=String(req.body?.listing_id||'');const l=await listing(lid);if(!l||!l.seller_auth_id||l.seller_auth_id===auth.id||l.status!=='active')return res.status(400).json({ok:false,message:'Бронь жасау мүмкін емес'});
   const r=await rows('/reservations?on_conflict=listing_id,buyer_id',{method:'POST',headers:H({...jsonHeaders,Prefer:'resolution=merge-duplicates,return=representation'}),body:JSON.stringify([{listing_id:lid,listing_title:l.title,buyer_id:auth.id,buyer_name:me.name,seller_id:l.seller_auth_id,status:'pending',updated_at:new Date().toISOString()}])});
   return res.status(201).json({ok:true,reservation:r[0]});
  }
  if(req.method==='POST'&&mode==='review'){
   const lid=String(req.body?.listing_id||''),rating=Number(req.body?.rating),comment=String(req.body?.comment||'').trim();const l=await listing(lid);
   if(!l||!l.seller_auth_id||l.seller_auth_id===auth.id||l.status!=='sold'||!Number.isInteger(rating)||rating<1||rating>5||comment.length>600)return res.status(400).json({ok:false,message:'Пікір деректері қате немесе сауда аяқталмаған'});
   const done=await rows(`/reservations?select=id&listing_id=eq.${lid}&buyer_id=eq.${auth.id}&status=in.(accepted,completed)&limit=1`);if(!done.length)return res.status(403).json({ok:false,message:'Пікірді тек расталған сатып алушы жаза алады'});
   const rv=await rows('/reviews?on_conflict=listing_id,reviewer_id',{method:'POST',headers:H({...jsonHeaders,Prefer:'resolution=merge-duplicates,return=representation'}),body:JSON.stringify([{listing_id:lid,listing_title:l.title,reviewer_id:auth.id,reviewer_name:me.name,seller_id:l.seller_auth_id,rating,comment}])});
   return res.status(201).json({ok:true,review:rv[0]});
  }
  if(req.method==='PATCH'&&mode==='offer_status'){
   const id=String(req.body?.id||''),status=String(req.body?.status||'');if(!idOk(id)||!['accepted','rejected','cancelled'].includes(status))return res.status(400).json({ok:false,message:'Статус қате'});
   const filter=status==='cancelled'?`id=eq.${id}&buyer_id=eq.${auth.id}`:`id=eq.${id}&seller_id=eq.${auth.id}`;
   const out=await rows(`/offers?${filter}`,{method:'PATCH',headers:jsonHeaders,body:JSON.stringify({status,updated_at:new Date().toISOString()})});if(!out.length)return res.status(403).json({ok:false,message:'Рұқсат жоқ'});return res.json({ok:true,offer:out[0]});
  }
  if(req.method==='PATCH'&&mode==='reservation_status'){
   const id=String(req.body?.id||''),status=String(req.body?.status||'');if(!idOk(id)||!['accepted','rejected','cancelled','completed'].includes(status))return res.status(400).json({ok:false,message:'Статус қате'});
   const filter=status==='cancelled'?`id=eq.${id}&buyer_id=eq.${auth.id}`:`id=eq.${id}&seller_id=eq.${auth.id}`;
   const out=await rows(`/reservations?${filter}`,{method:'PATCH',headers:jsonHeaders,body:JSON.stringify({status,updated_at:new Date().toISOString()})});if(!out.length)return res.status(403).json({ok:false,message:'Рұқсат жоқ'});return res.json({ok:true,reservation:out[0]});
  }
  if(req.method==='PATCH'&&mode==='profile'){
   const shop_name=String(req.body?.shop_name||'').trim(),bio=String(req.body?.bio||'').trim();if(shop_name.length>80||bio.length>500)return res.status(400).json({ok:false,message:'Дүкен ақпараты тым ұзын'});
   const out=await rows(`/users?auth_user_id=eq.${auth.id}`,{method:'PATCH',headers:jsonHeaders,body:JSON.stringify({shop_name,bio})});return res.json({ok:true,profile:out[0]});
  }
  if(req.method==='PATCH'&&mode==='verify'){
   if(!(me.role==='admin'||isAdminEmail(auth.email)))return res.status(403).json({ok:false,message:'Тек администратор'});const seller_id=String(req.body?.seller_id||'');if(!idOk(seller_id))return res.status(400).json({ok:false,message:'ID қате'});
   const out=await rows(`/users?auth_user_id=eq.${seller_id}`,{method:'PATCH',headers:jsonHeaders,body:JSON.stringify({verified:Boolean(req.body?.verified)})});return res.json({ok:true,profile:out[0]});
  }
  return res.status(405).json({ok:false,message:'Әрекет қолдау таппайды'});
 }catch(e){console.error('community',e.message);return res.status(500).json({ok:false,message:'Серверде қате'});}
};
