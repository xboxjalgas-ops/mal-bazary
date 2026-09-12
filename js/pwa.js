let installPrompt=null;
const installButtons=()=>document.querySelectorAll('[data-install-app]');
function showInstallButtons(){installButtons().forEach(button=>button.hidden=false);}
function hideInstallButtons(){installButtons().forEach(button=>button.hidden=true);}
function installFallbackMessage(){
  const message='Қолданбаны орнату үшін браузер мәзірінен “Install app”, “Add to Home Screen” немесе “Қолданбаны орнату” таңдаңыз.';
  if(typeof showToast==='function')showToast(message);else alert(message);
}
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('/service-worker.js').catch(()=>{}));
document.addEventListener('DOMContentLoaded',showInstallButtons);
window.addEventListener('load',showInstallButtons);
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;showInstallButtons();});
document.addEventListener('click',async event=>{const button=event.target.closest('[data-install-app]');if(!button)return;if(!installPrompt){installFallbackMessage();return;}installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;hideInstallButtons();});
window.addEventListener('appinstalled',hideInstallButtons);

(function(){
  const EASY_KEY='mb_easy_mode';
  const PANEL_KEY='mb_assistant_open';
  const WA_LINK='https://chat.whatsapp.com/JUtX2clH0fH2sV5bquRFDM';
  const SITE_SCOPE=['мал','сиыр','қой','жылқы','тауық','қаз','үйрек','қоян','бұзау','қошқар','саулық','құлын','жем','дәрі','дәрі-дәрмек','құрал','үйшік','хабарландыру','сату','сатып','баға','нарық','фермер','ауыл','облыс','аудан','сатушы','тіркел','кіру','google','сурет','фото','телефон','қоңырау','whatsapp','ватсап','чат','қауіп','құжат','төлем','жеткізу','орнат','қолданба','оңай','режим','mal','bazary','market','listing','profile','support','шағым','қолдау','карта','сүзгі','іздеу','сауда'];
  const BLOCKED_SCOPE=['саясат','дін','соғыс','казино','ставка','ересек','18+','хак','пароль бұзу','наркотик','есірткі','қару','bitcoin','крипто','үй жұмысы','реферат','математика','ауа райы','фильм','ойын','музыка','рецепт','дәрігерлік диагноз'];
  const animals={
    'сиыр':{label:'Сиыр',tips:['жасын, тұқымын, салмағын жазыңыз','сауын/етті бағыт екенін көрсетіңіз','ветпаспорт пен сырға нөмірін тексеріңіз']},
    'қой':{label:'Қой',tips:['саулық, қошқар немесе қозы екенін нақтылаңыз','тұқымын және шамамен салмағын жазыңыз','топпен сатылса санын көрсетіңіз']},
    'жылқы':{label:'Жылқы',tips:['жасын, жынысын, үйретілгенін жазыңыз','мінуге/союға/асыл тұқымға екенін көрсетіңіз','құжаты мен денсаулығын тексеріңіз']},
    'тауық':{label:'Тауық',tips:['тұқымын және жасын көрсетіңіз','жұмыртқалай ма, жоқ па жазыңыз','саны көп болса көтерме баға қосыңыз']},
    'қаз':{label:'Қаз',tips:['жасын және санын көрсетіңіз','тірі салмағын жазсаңыз сенім артады','жеткізу мүмкіндігін нақтылаңыз']},
    'үйрек':{label:'Үйрек',tips:['саны, жасы, тұқымы маңызды','бағаны біреуіне немесе топқа деп нақтылаңыз','суреті анық болсын']},
    'қоян':{label:'Қоян',tips:['тұқымын, жасын және салмағын жазыңыз','аналық/аталық екенін көрсетіңіз','торымен бірге берілсе бөлек белгілеңіз']}
  };
  const qa=[
    {id:'register',keys:['тіркел','киру','кіру','google','аккаунт','тірке','профиль'],title:'Қалай тіркелем?',text:'Нарық бетінде “Кіру” батырмасын басып, Google арқылы кіріңіз. Кейін аты-жөніңіз бен телефон нөміріңізді толтырыңыз. Телефон сатушымен байланыс үшін керек.',steps:['Нарыққа өтіңіз','Кіру батырмасын басыңыз','Google аккаунт таңдаңыз','Профильді сақтаңыз']},
    {id:'post-animal',keys:['жария','хабарландыру','сату','қосу','мал қос','сиыр сат','қой сат','жылқы сат'],title:'Малды қалай жариялаймын?',text:'“+ Хабарландыру беру” батырмасын басыңыз. Мал түрін, атауын, бағасын, облыс/ауданын, сипаттамасын және 8-ге дейін сурет қосыңыз.',steps:['Мал түрін таңдаңыз','Баға мен орынды жазыңыз','Сурет қосыңыз','Денсаулық/құжатты көрсетіңіз']},
    {id:'search',keys:['сатып','іздеу','табу','фильтр','сүзгі','баға','арзан','қымбат','облыс','аудан','карта'],title:'Малды қалай табам?',text:'Іздеу жолына мал түрін, ауылды немесе аудан атауын жазыңыз. Баға бойынша сұрыптаңыз және өңір сүзгісін қолданыңыз. Картадан облыс таңдау да көмектеседі.',steps:['Іздеу сөзін жазыңыз','Өңірді таңдаңыз','Баға бойынша сұрыптаңыз','Сатушымен байланысыңыз']},
    {id:'contact',keys:['қоңырау','телефон','ватсап','whatsapp','чат','байланыс','жазу','сатушы'],title:'Сатушымен қалай байланысам?',text:'Хабарландыру ішіндегі “Қоңырау”, “WhatsApp” немесе “Хат жазу” батырмасын қолданыңыз. Кездесуді нақтылап, малды көзбен көріп барып келісіңіз.',steps:['Телефонды тексеріңіз','Кездесу орнын нақтылаңыз','Малды көріңіз','Құжатын сұраңыз']},
    {id:'safe-trade',keys:['қауіп','алдау','сенім','құжат','төлем','ақша','предоплата','қауіпсіз'],title:'Қауіпсіз сауда қалай?',text:'Малды немесе өнімді көрмей тұрып алдын ала ақша жібермеңіз. Ветпаспорт, сырға нөмірі, денсаулық жағдайы және сатушы телефонын тексеріңіз.',steps:['Алдын ала ақша жібермеңіз','Құжатты тексеріңіз','Малды көзбен көріңіз','Күмән болса шағым жазыңыз']},
    {id:'install',keys:['орнат','қолданба','app','телефон','экран','pwa','add to home'],title:'Қолданбаны қалай орнатам?',text:'Басты беттегі “Қолданбаны орнату” батырмасын басыңыз. Егер батырма орнатпаса, браузер мәзірінен “Add to Home Screen” немесе “Install app” таңдаңыз.',steps:['Басты бетті ашыңыз','Қолданбаны орнату батырмасын басыңыз','Шықпаса браузер мәзірін ашыңыз','Add to Home Screen таңдаңыз']},
    {id:'easy',keys:['оңай','үлкен','жас','30','кәрі','ата','апа','көру','үлкен жазу'],title:'Оңай режим не үшін?',text:'Оңай режим үлкен жазу, анық батырма және аз анимация береді. Бұл 30+ қолданушыларға, ата-апаларға және телефоннан қолданатын адамдарға ыңғайлы.',steps:['Төменгі сол жақтағы батырманы басыңыз','Жазу үлкейеді','Батырмалар анық болады','Қайта бассаңыз стандарт режим']},
    {id:'photos',keys:['сурет','фото','жүктеу','image','8','көрінбей'],title:'Суретті қалай қосам?',text:'Хабарландыру формасында “Суреттерді таңдау” батырмасын басыңыз. JPG, PNG немесе WebP суреттерін таңдаңыз. 8 суретке дейін қосуға болады.',steps:['Сурет анық болсын','Мал толық көрінсін','Жақыннан бір фото қосыңыз','Құжат фотоcын жеке дерексіз салыңыз']},
    {id:'edit',keys:['өзгерту','өшіру','сатылды','редакт','жабу','delete'],title:'Хабарландыруды қалай өзгертем?',text:'Өз хабарландыруыңызда өңдеу батырмасын басыңыз. Мал сатылып кетсе, “Сатылды” деп белгілеңіз. Өшіруді тек қажет болса қолданыңыз.',steps:['Өз аккаунтыңызбен кіріңіз','Хабарландыруыңызды ашыңыз','Өңдеу немесе Сатылды таңдаңыз','Өзгерісті сақтаңыз']},
    {id:'support',keys:['көмек','қолдау','шағым','қате','істемейді','проблема','support'],title:'Қолдау қызметіне қалай жазам?',text:'Нарық бетінде “Көмек” батырмасын басыңыз. Санатты таңдап, мәселені қысқаша түсіндіріп жіберіңіз. Қате болса, қай бетте шыққанын жазыңыз.',steps:['Көмек батырмасын ашыңыз','Санатты таңдаңыз','Қате/мәселені жазыңыз','Жіберу батырмасын басыңыз']},
    {id:'products',keys:['жем','дәрі','дәрі-дәрмек','құрал','тауар','өнім','үйшік'],title:'Өнім немесе құрал қалай қосам?',text:'“Хабарландыру беру” терезесінде “Өнім/құрал қою” бөлімін таңдаңыз. Жем, дәрі-дәрмек немесе құрал-жабдық атауын, бағасын, орналасқан жерін және суретін қосыңыз.',steps:['Өнім/құрал бөлімін таңдаңыз','Санатын белгілеңіз','Бағасын жазыңыз','Сурет пен орынды қосыңыз']},
    {id:'price',keys:['баға қою','қанша','қымбат','арзан','орташа баға','бағасы'],title:'Бағаны қалай дұрыс қоям?',text:'Ұқсас хабарландыруларды қарап, өңіріңіздегі орташа бағаны салыстырыңыз. Малдың жасы, тұқымы, салмағы, денсаулығы және құжаты бағаға әсер етеді.',steps:['Ұқсас мал бағасын қараңыз','Салмақ/жас/тұқымды салыстырыңыз','Саудаласуға орын қалдырыңыз','Бағаны нақты ₸ форматында жазыңыз']}
  ];
  const suggestions=['Малды қалай жариялаймын?','Қауіпсіз сауда қалай?','Сиыр бағасын қалай қоям?','Суретті қалай қосам?','Оңай режим не үшін?','Қолданбаны қалай орнатам?'];
  function esc(value){return String(value??'').replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));}
  function normalize(value){return String(value||'').toLowerCase().replace(/ё/g,'е').trim();}
  function findAnimal(query){const q=normalize(query);return Object.keys(animals).find(name=>q.includes(name));}
  function inScope(query){const q=normalize(query);if(!q)return true;const hasBlocked=BLOCKED_SCOPE.some(word=>q.includes(word));const hasSite=SITE_SCOPE.some(word=>q.includes(word));return hasSite&&!hasBlocked;}
  function isEasy(){return localStorage.getItem(EASY_KEY)==='on';}
  function applyEasy(){document.documentElement.dataset.mbEasy=isEasy()?'on':'off';}
  function setEasy(on){localStorage.setItem(EASY_KEY,on?'on':'off');applyEasy();renderModeButtons();toast(on?'Оңай режим қосылды':'Стандарт режим қосылды');}
  function toast(message){if(typeof showToast==='function')showToast(message);}
  function score(item,query){const q=normalize(query);return item.keys.reduce((total,key)=>total+(q.includes(key)?2:0),0)+(q.includes(item.title.toLowerCase())?3:0);}
  function enrichAnswer(answer,query){
    const animalName=findAnimal(query);
    if(!animalName||!['post-animal','price','safe-trade','search'].includes(answer.id))return answer;
    const animal=animals[animalName];
    return {...answer,text:`${answer.text} ${animal.label} бойынша: ${animal.tips.join('; ')}.`,steps:[...(answer.steps||[]),...animal.tips.slice(0,2)]};
  }
  function answerFor(query){
    const q=normalize(query);
    if(!q)return {title:'Сұрақ жазыңыз',text:'Mal Bazary туралы сұрағыңызды жазыңыз: тіркелу, мал жариялау, іздеу, байланыс, қауіпсіз сауда немесе қолданба орнату.',steps:suggestions.slice(0,3)};
    if(!inScope(q))return {title:'Мен тек Mal Bazary бойынша көмектесем',text:'Бұл көмекші басқа тақырыпқа жауап бермейді. Mal Bazary сайтында мал сату/сатып алу, тіркелу, хабарландыру, қауіпсіз сауда, WhatsApp, қолданба орнату немесе оңай режим туралы сұраңыз.',steps:['Mal Bazary туралы сұрақ жазыңыз','Дайын сұрақ батырмасын таңдаңыз','Күрделі мәселе болса WhatsApp тобына өтіңіз']};
    const ranked=qa.map(item=>({...item,rank:score(item,q)})).sort((a,b)=>b.rank-a.rank);
    if(ranked[0]&&ranked[0].rank>0)return enrichAnswer(ranked[0],q);
    return {title:'Mal Bazary бойынша қысқа көмек',text:'Сұрағыңыз Mal Bazary-ға қатысты, бірақ нақты бөлімді түсінбедім. Тіркелу, мал жариялау, іздеу, баға, қауіпсіз сауда немесе байланыс туралы нақтылап сұраңыз.',steps:suggestions.slice(0,4)};
  }
  function injectStyle(){
    if(document.getElementById('mb-assistant-style'))return;
    const style=document.createElement('style');
    style.id='mb-assistant-style';
    style.textContent=`
      html[data-mb-easy="on"]{font-size:18px;scroll-behavior:auto;}
      html[data-mb-easy="on"] body{letter-spacing:.01em;}
      html[data-mb-easy="on"] .btn,html[data-mb-easy="on"] .chip,html[data-mb-easy="on"] .tab,html[data-mb-easy="on"] input,html[data-mb-easy="on"] select,html[data-mb-easy="on"] textarea{min-height:48px;font-size:16px!important;border-width:2px!important;}
      html[data-mb-easy="on"] .row-title,html[data-mb-easy="on"] .prod-name{font-size:18px!important;white-space:normal;}
      html[data-mb-easy="on"] .row-meta,html[data-mb-easy="on"] .prod-desc,html[data-mb-easy="on"] .modal-note{font-size:15px!important;line-height:1.55;}
      html[data-mb-easy="on"] .row-price,html[data-mb-easy="on"] .prod-price{font-size:20px!important;}
      html[data-mb-easy="on"] .row-card,html[data-mb-easy="on"] .prod-card,html[data-mb-easy="on"] .feature-card,html[data-mb-easy="on"] .step{box-shadow:none!important;transform:none!important;}
      html[data-mb-easy="on"] .hero::after,html[data-mb-easy="on"] .cta-band::after,html[data-mb-easy="on"] .fx-progress{display:none!important;}
      .mb-easy-toggle{position:fixed;left:16px;bottom:16px;z-index:210;border:2px solid var(--primary);background:var(--surface);color:var(--primary-dark);border-radius:999px;padding:12px 16px;font:800 14px Inter,sans-serif;box-shadow:var(--shadow-lg);cursor:pointer;}
      .mb-easy-toggle.is-on{background:var(--primary);color:#fff;}
      .mb-assistant-launcher{position:fixed;right:16px;bottom:16px;z-index:220;width:60px;height:60px;border:0;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--accent));color:#fff;box-shadow:0 14px 34px rgba(0,0,0,.24);font:900 24px Inter,sans-serif;cursor:pointer;display:grid;place-items:center;}
      .mb-assistant-launcher.is-hidden{opacity:0;pointer-events:none;transform:scale(.92);}
      .mb-assistant-panel{position:fixed;right:16px;bottom:88px;z-index:221;width:min(390px,calc(100vw - 32px));max-height:min(720px,calc(100vh - 112px));display:none;overflow:hidden;border:1.5px solid var(--border);border-radius:18px;background:var(--surface);box-shadow:0 20px 52px rgba(0,0,0,.24);}
      .mb-assistant-panel.open{display:flex;flex-direction:column;}
      .mb-assistant-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:15px 16px;background:linear-gradient(135deg,var(--primary),var(--primary-dark));color:#fff;}
      .mb-assistant-head b{display:block;font:900 16px Inter,sans-serif}.mb-assistant-head span{display:block;font-size:12px;opacity:.86;margin-top:2px}.mb-assistant-head button{border:0;background:rgba(255,255,255,.14);color:#fff;border-radius:9px;width:36px;height:36px;font-size:20px;cursor:pointer;}
      .mb-assistant-body{padding:14px;overflow:auto;display:grid;gap:12px;}
      .mb-scope-note{font-size:12px;line-height:1.35;color:var(--ink-soft);border:1px dashed var(--border);border-radius:10px;padding:8px 10px;background:var(--bg);}
      .mb-mode-card{border:1.5px solid var(--border);border-radius:14px;background:var(--bg);padding:12px;}
      .mb-mode-card strong{display:block;color:var(--primary-dark);margin-bottom:8px;}.mb-mode-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;}.mb-mode-actions button,.mb-quick button,.mb-assistant-send{min-height:44px;border:1.5px solid var(--border);border-radius:10px;background:var(--surface);color:var(--ink);font:800 13px Inter,sans-serif;cursor:pointer;}.mb-mode-actions button.active{background:var(--primary);border-color:var(--primary);color:#fff;}
      .mb-quick{display:grid;grid-template-columns:1fr 1fr;gap:8px;}.mb-quick button{text-align:left;padding:10px;line-height:1.2;}
      .mb-answer{border-left:4px solid var(--primary);background:color-mix(in srgb,var(--primary) 8%,var(--surface));border-radius:12px;padding:12px;line-height:1.5;}.mb-answer b{display:block;margin-bottom:5px;color:var(--primary-dark);}.mb-answer small{display:block;margin-top:8px;color:var(--ink-soft);}.mb-answer ol{margin:8px 0 0 20px;padding:0}.mb-answer li{margin:4px 0;}
      .mb-assistant-form{display:grid;grid-template-columns:1fr auto;gap:8px;}.mb-assistant-input{width:100%;border:1.5px solid var(--border);border-radius:10px;padding:11px 12px;background:var(--surface);color:var(--ink);font:14px Inter,sans-serif;}.mb-assistant-send{padding:0 14px;background:var(--primary);border-color:var(--primary);color:#fff;}
      .mb-assistant-wa{display:flex;align-items:center;justify-content:center;min-height:44px;border-radius:10px;background:#25d366;color:#fff;text-decoration:none;font:900 13px Inter,sans-serif;}
      @media(max-width:520px){.mb-easy-toggle{left:12px;bottom:12px;padding:11px 13px}.mb-assistant-launcher{right:12px;bottom:12px}.mb-assistant-panel{right:12px;left:12px;bottom:84px;width:auto}.mb-quick,.mb-mode-actions{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }
  function showAnswer(item){
    const box=document.querySelector('[data-mb-answer]');
    if(!box)return;
    const steps=Array.isArray(item.steps)&&item.steps.length?`<ol>${item.steps.slice(0,5).map(step=>`<li>${esc(step)}</li>`).join('')}</ol>`:'';
    box.innerHTML=`<b>${esc(item.title)}</b><div>${esc(item.text)}</div>${steps}<small>Көмекші тек Mal Bazary тақырыбында жауап береді.</small>`;
  }
  function renderModeButtons(){
    const toggle=document.querySelector('.mb-easy-toggle');
    if(toggle){toggle.classList.toggle('is-on',isEasy());toggle.textContent='👀 Оңай режим';toggle.setAttribute('aria-pressed',String(isEasy()));}
    document.querySelectorAll('[data-mb-mode]').forEach(button=>button.classList.toggle('active',(button.dataset.mbMode==='easy')===isEasy()));
  }
  function buildWidget(){
    if(document.querySelector('.mb-assistant-launcher'))return;
    const easyToggle=document.createElement('button');
    easyToggle.className='mb-easy-toggle';
    easyToggle.type='button';
    easyToggle.addEventListener('click',()=>setEasy(!isEasy()));
    document.body.appendChild(easyToggle);
    const launcher=document.createElement('button');
    launcher.className='mb-assistant-launcher';
    launcher.type='button';
    launcher.setAttribute('aria-label','Mal Bazary AI көмекшіні ашу');
    launcher.textContent='🤖';
    document.body.appendChild(launcher);
    const panel=document.createElement('section');
    panel.className='mb-assistant-panel';
    panel.setAttribute('aria-label','Mal Bazary AI көмекші');
    panel.innerHTML=`
      <div class="mb-assistant-head"><div><b>Mal Bazary AI көмекші</b><span>Smart v3 — тек мал базар тақырыбы</span></div><button type="button" aria-label="Жабу">×</button></div>
      <div class="mb-assistant-body">
        <div class="mb-scope-note">Бұл mini-AI тек Mal Bazary: мал сату/алу, хабарландыру, баға, қауіпсіз сауда, байланыс және қолдану сұрақтарына жауап береді.</div>
        <div class="mb-mode-card"><strong>Қолдану режимі</strong><div class="mb-mode-actions"><button type="button" data-mb-mode="standard">Стандарт</button><button type="button" data-mb-mode="easy">Оңай режим 30+</button></div></div>
        <div class="mb-quick">${suggestions.map((title,index)=>`<button type="button" data-mb-suggestion="${index}">${esc(title)}</button>`).join('')}</div>
        <div class="mb-answer" data-mb-answer><b>Сәлем, досым!</b><div>Мен Mal Bazary бойынша көмек берем: тіркелу, мал жариялау, іздеу, баға, байланыс, қауіпсіз сауда және қолданба орнату.</div><ol><li>Сұрағыңызды жазыңыз</li><li>Нақты мал түрін көрсетсеңіз, жауап дәлірек болады</li><li>Басқа тақырыпқа ауытқымаймын</li></ol><small>Scoped mini-AI v3</small></div>
        <form class="mb-assistant-form"><input class="mb-assistant-input" placeholder="Мысалы: сиырды қалай сатам?" aria-label="AI көмекшіге сұрақ"><button class="mb-assistant-send" type="submit">Жіберу</button></form>
        <a class="mb-assistant-wa" href="${WA_LINK}" target="_blank" rel="noopener noreferrer">WhatsApp тобына қосылу</a>
      </div>`;
    document.body.appendChild(panel);
    function setOpen(open){panel.classList.toggle('open',open);launcher.classList.toggle('is-hidden',open);localStorage.setItem(PANEL_KEY,open?'1':'0');}
    launcher.addEventListener('click',()=>setOpen(!panel.classList.contains('open')));
    panel.querySelector('.mb-assistant-head button').addEventListener('click',()=>setOpen(false));
    panel.querySelectorAll('[data-mb-mode]').forEach(button=>button.addEventListener('click',()=>setEasy(button.dataset.mbMode==='easy')));
    panel.querySelectorAll('[data-mb-suggestion]').forEach(button=>button.addEventListener('click',()=>showAnswer(answerFor(suggestions[Number(button.dataset.mbSuggestion)]))));
    panel.querySelector('form').addEventListener('submit',event=>{event.preventDefault();const input=panel.querySelector('.mb-assistant-input');showAnswer(answerFor(input.value));input.value='';});
    if(localStorage.getItem(PANEL_KEY)==='1')setOpen(true);
    renderModeButtons();
  }
  function init(){try{injectStyle();applyEasy();buildWidget();}catch(error){console.warn('Mal Bazary assistant failed',error);}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
