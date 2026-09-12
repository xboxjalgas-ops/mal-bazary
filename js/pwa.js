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
  const qa=[
    {keys:['тіркел','киру','кіру','google','аккаунт','тірке'],title:'Қалай тіркелем?',text:'Google арқылы кіресіз, содан кейін аты-жөніңіз бен телефон нөміріңізді толтырасыз. Нарық бетінде “Кіру” батырмасын басыңыз.'},
    {keys:['жария','хабарландыру','сату','қосу','мал қос'],title:'Малды қалай жариялаймын?',text:'Нарық бетіне өтіп, “+ Хабарландыру беру” батырмасын басыңыз. Мал түрін, бағасын, орналасқан жерін және суреттерін қосыңыз.'},
    {keys:['сатып','іздеу','табу','фильтр','баға'],title:'Малды қалай табам?',text:'Іздеу жолына мал түрін немесе ауыл/аудан атауын жазыңыз. Баға бойынша сұрыптап, өңір сүзгісін қолданыңыз.'},
    {keys:['қоңырау','телефон','ватсап','whatsapp','чат','байланыс'],title:'Сатушымен қалай байланысам?',text:'Хабарландырудағы “Қоңырау”, “WhatsApp-қа жазу” немесе “Хат” батырмасын қолданыңыз. Алдын ала ақша жібермеңіз.'},
    {keys:['қауіп','алдау','сенім','құжат','төлем'],title:'Қауіпсіз сауда қалай?',text:'Малды көрмей тұрып ақша жібермеңіз. Сатушыны, құжатты, малдың жағдайын және орналасқан жерін тексеріңіз. Күмән болса, шағым жіберіңіз.'},
    {keys:['орнат','қолданба','app','телефон','экран'],title:'Қолданбаны қалай орнатам?',text:'Басты беттегі “Қолданбаны орнату” батырмасын басыңыз. Егер шықпаса, браузер мәзірінен “Add to Home Screen” немесе “Install app” таңдаңыз.'},
    {keys:['оңай','үлкен','жас','30','кәрі','ата','апа'],title:'Оңай режим не үшін?',text:'Оңай режимде жазу үлкенірек, батырмалар анық, анимация аз және негізгі әрекеттер көзге тез түседі. Оны кез келген қолданушы қоса алады.'}
  ];
  function esc(value){return String(value??'').replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));}
  function isEasy(){return localStorage.getItem(EASY_KEY)==='on';}
  function applyEasy(){document.documentElement.dataset.mbEasy=isEasy()?'on':'off';}
  function setEasy(on){localStorage.setItem(EASY_KEY,on?'on':'off');applyEasy();renderModeButtons();toast(on?'Оңай режим қосылды':'Стандарт режим қосылды');}
  function toast(message){if(typeof showToast==='function')showToast(message);}
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
      .mb-assistant-panel{position:fixed;right:16px;bottom:88px;z-index:221;width:min(380px,calc(100vw - 32px));max-height:min(680px,calc(100vh - 112px));display:none;overflow:hidden;border:1.5px solid var(--border);border-radius:18px;background:var(--surface);box-shadow:0 20px 52px rgba(0,0,0,.24);}
      .mb-assistant-panel.open{display:flex;flex-direction:column;}
      .mb-assistant-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:15px 16px;background:linear-gradient(135deg,var(--primary),var(--primary-dark));color:#fff;}
      .mb-assistant-head b{display:block;font:900 16px Inter,sans-serif}.mb-assistant-head span{display:block;font-size:12px;opacity:.86;margin-top:2px}.mb-assistant-head button{border:0;background:rgba(255,255,255,.14);color:#fff;border-radius:9px;width:36px;height:36px;font-size:20px;cursor:pointer;}
      .mb-assistant-body{padding:14px;overflow:auto;display:grid;gap:12px;}
      .mb-mode-card{border:1.5px solid var(--border);border-radius:14px;background:var(--bg);padding:12px;}
      .mb-mode-card strong{display:block;color:var(--primary-dark);margin-bottom:8px;}.mb-mode-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;}.mb-mode-actions button,.mb-quick button,.mb-assistant-send{min-height:44px;border:1.5px solid var(--border);border-radius:10px;background:var(--surface);color:var(--ink);font:800 13px Inter,sans-serif;cursor:pointer;}.mb-mode-actions button.active{background:var(--primary);border-color:var(--primary);color:#fff;}
      .mb-quick{display:grid;grid-template-columns:1fr 1fr;gap:8px;}.mb-quick button{text-align:left;padding:10px;line-height:1.2;}
      .mb-answer{border-left:4px solid var(--primary);background:color-mix(in srgb,var(--primary) 8%,var(--surface));border-radius:12px;padding:12px;line-height:1.5;}.mb-answer b{display:block;margin-bottom:5px;color:var(--primary-dark);}.mb-answer small{display:block;margin-top:8px;color:var(--ink-soft);}
      .mb-assistant-form{display:grid;grid-template-columns:1fr auto;gap:8px;}.mb-assistant-input{width:100%;border:1.5px solid var(--border);border-radius:10px;padding:11px 12px;background:var(--surface);color:var(--ink);font:14px Inter,sans-serif;}.mb-assistant-send{padding:0 14px;background:var(--primary);border-color:var(--primary);color:#fff;}
      .mb-assistant-wa{display:flex;align-items:center;justify-content:center;min-height:44px;border-radius:10px;background:#25d366;color:#fff;text-decoration:none;font:900 13px Inter,sans-serif;}
      @media(max-width:520px){.mb-easy-toggle{left:12px;bottom:12px;padding:11px 13px}.mb-assistant-launcher{right:12px;bottom:12px}.mb-assistant-panel{right:12px;left:12px;bottom:84px;width:auto}.mb-quick,.mb-mode-actions{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }
  function answerFor(query){
    const q=String(query||'').toLowerCase();
    return qa.find(item=>item.keys.some(key=>q.includes(key)))||{title:'Көмек керек пе?',text:'Мен тіркелу, хабарландыру беру, мал іздеу, сатушымен байланысу, қауіпсіз сауда және қолданбаны орнату бойынша көмектесем. Төмендегі дайын сұрақтардың бірін таңдаңыз.'};
  }
  function showAnswer(item){
    const box=document.querySelector('[data-mb-answer]');
    if(!box)return;
    box.innerHTML=`<b>${esc(item.title)}</b><div>${esc(item.text)}</div><small>Егер жауап жеткіліксіз болса, WhatsApp тобына қосылып сұрай аласыз.</small>`;
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
      <div class="mb-assistant-head"><div><b>Mal Bazary AI көмекші</b><span>Жылдам жауап және оңай режим</span></div><button type="button" aria-label="Жабу">×</button></div>
      <div class="mb-assistant-body">
        <div class="mb-mode-card"><strong>Қолдану режимі</strong><div class="mb-mode-actions"><button type="button" data-mb-mode="standard">Стандарт</button><button type="button" data-mb-mode="easy">Оңай режим 30+</button></div></div>
        <div class="mb-quick">${qa.slice(0,6).map((item,index)=>`<button type="button" data-mb-q="${index}">${esc(item.title)}</button>`).join('')}</div>
        <div class="mb-answer" data-mb-answer><b>Сәлем, досым!</b><div>Мен Mal Bazary сайтында тіркелу, мал жариялау, іздеу және қауіпсіз сауда бойынша көмектесем.</div><small>Сұрақ таңдаңыз немесе өзіңіз жазыңыз.</small></div>
        <form class="mb-assistant-form"><input class="mb-assistant-input" placeholder="Сұрағыңызды жазыңыз..." aria-label="AI көмекшіге сұрақ"><button class="mb-assistant-send" type="submit">Жіберу</button></form>
        <a class="mb-assistant-wa" href="${WA_LINK}" target="_blank" rel="noopener noreferrer">WhatsApp тобына қосылу</a>
      </div>`;
    document.body.appendChild(panel);

    function setOpen(open){panel.classList.toggle('open',open);localStorage.setItem(PANEL_KEY,open?'1':'0');}
    launcher.addEventListener('click',()=>setOpen(!panel.classList.contains('open')));
    panel.querySelector('.mb-assistant-head button').addEventListener('click',()=>setOpen(false));
    panel.querySelectorAll('[data-mb-mode]').forEach(button=>button.addEventListener('click',()=>setEasy(button.dataset.mbMode==='easy')));
    panel.querySelectorAll('[data-mb-q]').forEach(button=>button.addEventListener('click',()=>showAnswer(qa[Number(button.dataset.mbQ)])));
    panel.querySelector('form').addEventListener('submit',event=>{event.preventDefault();const input=panel.querySelector('.mb-assistant-input');showAnswer(answerFor(input.value));input.value='';});
    if(localStorage.getItem(PANEL_KEY)==='1')setOpen(true);
    renderModeButtons();
  }
  function init(){try{injectStyle();applyEasy();buildWidget();}catch(error){console.warn('Mal Bazary assistant failed',error);}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
