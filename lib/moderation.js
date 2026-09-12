const MAL_BAZARY_SCOPE = [
  'мал','сиыр','қой','жылқы','тауық','қаз','үйрек','қоян','бұзау','қошқар','саулық','құлын',
  'жем','дәрі','дәрі-дәрмек','құрал','үйшік','хабарландыру','сату','сатып','баға','нарық',
  'фермер','ауыл','облыс','аудан','сатушы','тіркел','кіру','google','сурет','фото','телефон',
  'қоңырау','whatsapp','ватсап','чат','қауіп','құжат','төлем','жеткізу','орнат','қолданба',
  'оңай','режим','mal','bazary','market','listing','profile','support','шағым','қолдау','карта','сүзгі','іздеу','сауда'
];
const OFF_TOPIC = ['саясат','дін','соғыс','казино','ставка','18+','хак','пароль бұзу','наркотик','есірткі','қару','bitcoin','крипто','реферат','математика','ауа райы','фильм','ойын','музыка','рецепт'];
const HARD_BLOCK = ['наркотик','есірткі','қару сатам','қару алам','порно','18+','казино','ставка','пароль бұзу','hack','scam'];
const SUSPICIOUS = ['алдын ала төлем','предоплата','картаға жібер','қазір ақша жібер','құжат жоқ','телефон жоқ','өте арзан','тез ақша'];
const OPENAI_URL = ['https://api.openai.com','/v1/chat/completions'].join('');

function normalize(value){return String(value||'').toLowerCase().replace(/ё/g,'е').trim();}
function includesAny(text, words){const q=normalize(text);return words.some(word=>q.includes(normalize(word)));}
function isMalBazaryScope(text){const q=normalize(text);return q.length===0 || (includesAny(q,MAL_BAZARY_SCOPE) && !includesAny(q,OFF_TOPIC));}
function safeText(value,max=2000){return String(value||'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);}
function buildModerationText(input={}){
  return [input.kind,input.type,input.title,input.name,input.category,input.description,input.price,input.location,input.region,input.district,input.village,JSON.stringify(input.animal_details||{})].map(x=>safeText(x,600)).filter(Boolean).join('\n');
}
function ruleModerate(input={}){
  const text=buildModerationText(input);
  if(includesAny(text,HARD_BLOCK))return {status:'rejected',risk:'high',reason:'Қауіпті немесе рұқсат етілмейтін сөз табылды',source:'rules'};
  if(!isMalBazaryScope(text))return {status:'pending',risk:'medium',reason:'Хабарландыру Mal Bazary тақырыбына анық сәйкес келмейді',source:'rules'};
  if(includesAny(text,SUSPICIOUS))return {status:'pending',risk:'medium',reason:'Қауіпсіз саудаға күмәнді сөздер бар',source:'rules'};
  return {status:'approved',risk:'low',reason:'Ереже бойынша қауіп анықталмады',source:'rules'};
}
async function aiModerate(input={}){
  if(!process.env.OPENAI_API_KEY)return null;
  const text=buildModerationText(input);
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),4500);
  try{
    const response=await fetch(OPENAI_URL,{
      method:'POST',
      headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},
      signal:controller.signal,
      body:JSON.stringify({
        model:process.env.OPENAI_MODEL||'gpt-4o-mini',temperature:0,max_tokens:120,response_format:{type:'json_object'},
        messages:[
          {role:'system',content:'You moderate a Kazakh livestock marketplace called Mal Bazary. Return only JSON: {"status":"approved|pending|rejected","risk":"low|medium|high","reason":"short Kazakh reason"}. Approve normal livestock/feed/tool listings. Reject illegal, adult, weapons, drugs, scams. Pending for suspicious payment, off-topic, unclear, or missing trust signals.'},
          {role:'user',content:text.slice(0,4000)}
        ]
      })
    });
    if(!response.ok)return null;
    const data=await response.json();
    const parsed=JSON.parse(data.choices?.[0]?.message?.content||'{}');
    if(!['approved','pending','rejected'].includes(parsed.status))return null;
    return {status:parsed.status,risk:['low','medium','high'].includes(parsed.risk)?parsed.risk:'medium',reason:safeText(parsed.reason,180)||'AI модерация қорытындысы',source:'ai'};
  }catch{return null;}finally{clearTimeout(timer);}
}
async function moderateContent(input={}){
  const rule=ruleModerate(input);
  if(rule.status==='rejected')return rule;
  const ai=await aiModerate(input);
  if(!ai)return rule;
  if(ai.status==='rejected'||ai.risk==='high')return ai;
  if(rule.status==='pending'||ai.status==='pending')return {...ai,status:'pending',risk:ai.risk==='low'?'medium':ai.risk};
  return ai;
}
module.exports={MAL_BAZARY_SCOPE,OFF_TOPIC,safeText,isMalBazaryScope,ruleModerate,moderateContent};
