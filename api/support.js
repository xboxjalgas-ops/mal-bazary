const { requireAuth, isAdminEmail, noStore } = require('../lib/auth');
const {protect}=require('../lib/security');
const {isMalBazaryScope,safeText}=require('../lib/moderation');
const CATEGORIES=['Тіркелу','Хабарландыру','Сурет','Қауіпсіздік','Техникалық қате','Шағым','Басқа'];
const STATUSES=['new','in_progress','answered','closed'];
const OPENAI_URL=['https://api.openai.com','/v1/chat/completions'].join('');
const headers=extra=>({apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,...extra});
const base=()=>`${process.env.SUPABASE_URL}/rest/v1/support_tickets`;
const LOCAL_ANSWERS=[
 {keys:['тіркел','кіру','google','аккаунт','профиль'],answer:'Нарық бетінде “Кіру” батырмасын басып, Google арқылы кіріңіз. Кейін аты-жөніңіз бен телефон нөміріңізді толтырыңыз.'},
 {keys:['жария','хабарландыру','сату','қосу'],answer:'“+ Хабарландыру беру” батырмасын басыңыз. Мал түрін, бағасын, орналасқан жерін, сипаттамасын және суреттерін қосыңыз.'},
 {keys:['баға','қанша','арзан','қымбат'],answer:'Бағаны ұқсас хабарландырулармен салыстырып қойыңыз. Жасы, салмағы, тұқымы, құжаты және орналасқан жері бағаға әсер етеді.'},
 {keys:['қауіп','алдау','төлем','құжат'],answer:'Малды көрмей тұрып алдын ала ақша жібермеңіз. Ветпаспорт, сырға нөмірі, сатушы телефоны және малдың жағдайын тексеріңіз.'},
 {keys:['whatsapp','ватсап','қоңырау','чат','байланыс'],answer:'Хабарландырудағы қоңырау, WhatsApp немесе хат жазу батырмасын қолданыңыз. Кездесуді нақтылап, малды көзбен көріңіз.'},
 {keys:['орнат','қолданба','pwa','экран'],answer:'Басты беттегі “Қолданбаны орнату” батырмасын басыңыз. Шықпаса, браузер мәзірінен “Add to Home Screen” таңдаңыз.'}
];
function localAnswer(question){const q=safeText(question,500).toLowerCase();const hit=LOCAL_ANSWERS.find(item=>item.keys.some(key=>q.includes(key)));return hit?.answer||'Mal Bazary бойынша көмектесе аламын: тіркелу, мал жариялау, іздеу, баға қою, қауіпсіз сауда, байланыс және қолданба орнату туралы сұраңыз.';}
async function aiAnswer(question){
 if(!process.env.OPENAI_API_KEY)return null;const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),7000);
 try{const response=await fetch(OPENAI_URL,{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-4o-mini',temperature:0.2,max_tokens:280,messages:[{role:'system',content:'You are Mal Bazary assistant. Answer only about the Mal Bazary livestock marketplace in Kazakh. Allowed topics: registering, listing livestock/products, search/filter, prices, seller/buyer contact, safe trade, support, PWA install, easy mode. If off-topic, refuse briefly in Kazakh and redirect to Mal Bazary topics. Never ask for passwords, never reveal secrets, never provide non-Mal-Bazary advice.'},{role:'user',content:safeText(question,900)}]})});if(!response.ok)return null;const data=await response.json();return safeText(data.choices?.[0]?.message?.content,900)||null;}catch{return null;}finally{clearTimeout(timer);}
}
async function handleAssistant(req,res){const question=safeText(req.body?.question,900);if(question.length<2)return res.status(400).json({ok:false,message:'Сұрақты жазыңыз'});if(!isMalBazaryScope(question))return res.status(200).json({ok:true,scoped:true,answer:'Мен тек Mal Bazary бойынша көмектесем. Мал сату/алу, хабарландыру, баға, қауіпсіз сауда, байланыс немесе қолданба орнату туралы сұраңыз.'});const answer=await aiAnswer(question)||localAnswer(question);return res.status(200).json({ok:true,scoped:true,answer});}
module.exports=async(req,res)=>{
 noStore(res);const isAssistant=req.method==='POST'&&(req.query?.assistant==='1'||req.body?.assistant===true);if(!protect(req,res,{write:req.method!=='GET',limit:isAssistant?30:(req.method==='GET'?60:12),windowMs:600000,maxBytes:isAssistant?8000:100000}))return;if(isAssistant)return handleAssistant(req,res);const authUser=await requireAuth(req,res);if(!authUser)return;
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
