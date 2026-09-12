const { protect } = require('../lib/security');
const { noStore } = require('../lib/auth');
const { isMalBazaryScope, safeText } = require('../lib/moderation');
const OPENAI_URL = ['https://api.openai.com','/v1/chat/completions'].join('');

const LOCAL_ANSWERS = [
  {keys:['тіркел','кіру','google','аккаунт','профиль'],answer:'Нарық бетінде “Кіру” батырмасын басып, Google арқылы кіріңіз. Кейін аты-жөніңіз бен телефон нөміріңізді толтырыңыз.'},
  {keys:['жария','хабарландыру','сату','қосу'],answer:'“+ Хабарландыру беру” батырмасын басыңыз. Мал түрін, бағасын, орналасқан жерін, сипаттамасын және суреттерін қосыңыз.'},
  {keys:['баға','қанша','арзан','қымбат'],answer:'Бағаны ұқсас хабарландырулармен салыстырып қойыңыз. Жасы, салмағы, тұқымы, құжаты және орналасқан жері бағаға әсер етеді.'},
  {keys:['қауіп','алдау','төлем','құжат'],answer:'Малды көрмей тұрып алдын ала ақша жібермеңіз. Ветпаспорт, сырға нөмірі, сатушы телефоны және малдың жағдайын тексеріңіз.'},
  {keys:['whatsapp','ватсап','қоңырау','чат','байланыс'],answer:'Хабарландырудағы қоңырау, WhatsApp немесе хат жазу батырмасын қолданыңыз. Кездесуді нақтылап, малды көзбен көріңіз.'},
  {keys:['орнат','қолданба','pwa','экран'],answer:'Басты беттегі “Қолданбаны орнату” батырмасын басыңыз. Шықпаса, браузер мәзірінен “Add to Home Screen” таңдаңыз.'}
];
function localAnswer(question){
  const q=safeText(question,500).toLowerCase();
  const hit=LOCAL_ANSWERS.find(item=>item.keys.some(key=>q.includes(key)));
  return hit?.answer || 'Mal Bazary бойынша көмектесе аламын: тіркелу, мал жариялау, іздеу, баға қою, қауіпсіз сауда, байланыс және қолданба орнату туралы сұраңыз.';
}
async function aiAnswer(question){
  if(!process.env.OPENAI_API_KEY)return null;
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),7000);
  try{
    const response=await fetch(OPENAI_URL,{
      method:'POST',
      headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},
      signal:controller.signal,
      body:JSON.stringify({
        model:process.env.OPENAI_MODEL||'gpt-4o-mini',temperature:0.2,max_tokens:280,
        messages:[
          {role:'system',content:'You are Mal Bazary assistant. Answer only about the Mal Bazary livestock marketplace in Kazakh. Allowed topics: registering, listing livestock/products, search/filter, prices, seller/buyer contact, safe trade, support, PWA install, easy mode. If off-topic, refuse briefly in Kazakh and redirect to Mal Bazary topics. Never ask for passwords, never reveal secrets, never provide non-Mal-Bazary advice.'},
          {role:'user',content:safeText(question,900)}
        ]
      })
    });
    if(!response.ok)return null;
    const data=await response.json();
    return safeText(data.choices?.[0]?.message?.content,900)||null;
  }catch{return null;}finally{clearTimeout(timer);}
}
module.exports=async(req,res)=>{
  noStore(res);
  if(!protect(req,res,{write:true,methods:['POST'],limit:30,windowMs:600000,maxBytes:8000}))return;
  const question=safeText(req.body?.question,900);
  if(question.length<2)return res.status(400).json({ok:false,message:'Сұрақты жазыңыз'});
  if(!isMalBazaryScope(question))return res.status(200).json({ok:true,scoped:true,answer:'Мен тек Mal Bazary бойынша көмектесем. Мал сату/алу, хабарландыру, баға, қауіпсіз сауда, байланыс немесе қолданба орнату туралы сұраңыз.'});
  const answer=await aiAnswer(question) || localAnswer(question);
  return res.status(200).json({ok:true,scoped:true,answer});
};
