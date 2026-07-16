/* =========================================================
   Мал Базары — demo frontend logic (backend жоқ, деректер жадта)
   ========================================================= */

/* ---------- SECURITY: HTML escaping (XSS-тен қорғау) ----------
   Пайдаланушы енгізген кез келген мәтінді экранда HTML ретінде
   көрсетпес бұрын осы функция арқылы өткіземіз. Бұл біреудің
   хабарландыру өрісіне <script> немесе басқа HTML кодын салып,
   басқа қолданушыларға зиян тигізуіне жол бермейді. */
function escapeHTML(str){
  const div = document.createElement('div');
  div.textContent = String(str ?? '');
  return div.innerHTML;
}

/* ---------- PHONE MASK (+7 префиксі әрдайым тұрақты) ---------- */
function attachPhoneMask(input){
  function format(digits){
    digits = digits.slice(0, 10);
    let out = '+7';
    if(digits.length > 0) out += ' ' + digits.slice(0,3);
    if(digits.length > 3) out += ' ' + digits.slice(3,6);
    if(digits.length > 6) out += ' ' + digits.slice(6,8);
    if(digits.length > 8) out += ' ' + digits.slice(8,10);
    return out;
  }
  function digitsOnly(val){
    let d = val.replace(/\D/g, '');
    if(d.startsWith('7')) d = d.slice(1); // "+7" ішіндегі 7-ні қайта санамау
    return d;
  }
  input.addEventListener('focus', () => {
    if(!input.value) input.value = '+7 ';
    const pos = input.value.length;
    requestAnimationFrame(() => input.setSelectionRange(pos, pos));
  });
  input.addEventListener('input', () => {
    input.value = format(digitsOnly(input.value));
    const pos = input.value.length;
    input.setSelectionRange(pos, pos);
  });
  input.addEventListener('keydown', (e) => {
    // "+7 " префиксін өшіруге тыйым салу
    if((e.key === 'Backspace' || e.key === 'Delete') &&
       input.selectionStart <= 3 && input.selectionEnd <= 3){
      e.preventDefault();
    }
  });
}
function resetPhoneField(id){
  const el = document.getElementById(id);
  el.value = '+7 ';
}

/* ---------- ICONS ---------- */
const icons = {
  "Сиыр": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 15c0-4 3-7 8-7s8 3 8 7-3 5-8 5-8-1-8-5z"/><path d="M6 8L4 5M18 8l2-3"/><circle cx="9" cy="11" r="1"/></svg>',
  "Қой": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="7"/><circle cx="8" cy="9" r="1"/><path d="M12 19v2M7 4l1 2M17 4l-1 2"/></svg>',
  "Жылқы": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 18c0-5 2-11 7-13 3 1 3 4 1 5l3 2 3 6"/><circle cx="10" cy="7" r="1"/><path d="M5 18h3M15 18h4"/></svg>',
  "Тауық": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 15c0-4 2-7 6-7 3 0 5 2 5 4s-2 3-4 3"/><path d="M6 12l-2-1M6 12l-1 2"/><circle cx="15" cy="9" r="1"/><path d="M10 18l-1 3M15 18l1 3"/></svg>',
  "Қаз": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 16c0-5 3-9 7-9 2.5 0 4 1.5 4 3.5S16.5 14 15 13"/><path d="M4 13l3-1"/><circle cx="14" cy="8" r="1"/><path d="M9 19l-1 2M14 19l1 2"/></svg>',
  "Үйрек": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 15c1-4 4-6 8-6 4 0 7 2 7 5s-3 4-6 4"/><path d="M19 12l3-1"/><circle cx="10" cy="10" r="1"/></svg>',
  "Қоян": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><ellipse cx="12" cy="15" rx="6" ry="5"/><path d="M9 10C8 6 8 3 9 2M15 10c1-4 1-7 0-8"/><circle cx="10" cy="14" r="1"/></svg>'
};
const catColors = {
  "Сиыр":"#5A3B2E","Қой":"#7C7259","Жылқы":"#3F5A38","Тауық":"#A6531F","Қаз":"#35708A","Үйрек":"#4B6E7A","Қоян":"#8A6BA8"
};
function iconChip(type){ return `<div style="width:28px;height:28px;color:${catColors[type]}">${icons[type]}</div>`; }

/* ---------- DATA (in-memory only, demo) ---------- */
let listings = [
  {type:"Сиыр", title:"Қазақы сиыр, 3 жаста, сауын", desc:"Күніне 12л сүт береді, сау, вакцинасы толық.", price:520000, loc:"Сарыағаш ауданы", seller:"Асхат Н.", phone:"+7 701 234 56 78"},
  {type:"Қой", title:"Едильбай қошақан, 8 айлық", desc:"Салмағы 45кг, семіз, отбасылық шаруашылықтан.", price:95000, loc:"Түркістан қаласы", seller:"Гүлмира А.", phone:"+7 702 345 67 89"},
  {type:"Жылқы", title:"Жылқы, 4 жаста, биесі", desc:"Құлын әкелген, момын мінезді, жеккіш емес.", price:650000, loc:"Ордабасы ауданы", seller:"Дархан Т.", phone:"+7 705 111 22 33"},
  {type:"Тауық", title:"Тауық (20 бас), жұмыртқалы тұқым", desc:"Ломан браун, айына 25-27 жұмыртқа береді.", price:3500, loc:"Шардара ауданы", seller:"Айгүл С.", phone:"+7 707 888 99 00"},
  {type:"Қаз", title:"Қаз, ересек жұп (аталық+аналық)", desc:"Таза холмогор тұқымы, жасы 1.5 жыл.", price:60000, loc:"Сарыағаш ауданы", seller:"Нұрлан Қ.", phone:"+7 700 555 44 33"},
  {type:"Қоян", title:"Қоян балалары, 2 айлық (10 бас)", desc:"Калифорния тұқымы, тез өседі, сау.", price:8000, loc:"Түркістан қаласы", seller:"Бекзат М.", phone:"+7 747 222 11 00"}
];

const feed = [
  {tag:"tag-good",tagText:"САПАЛЫ",name:"Жоғары сортты пішен-жем қоспасы",desc:"Витаминдер қосылған, ірі қараға арналған, 1 қап 50кг.",price:"18 000 ₸ / қап"},
  {tag:"tag-budget",tagText:"ҚОЛЖЕТІМДІ",name:"Қарапайым сұлы-арпа қоспасы",desc:"Күнделікті азықтандыруға, экономды баға.",price:"7 500 ₸ / қап"},
  {tag:"tag-good",tagText:"САПАЛЫ",name:"Құс жемі (премиум)",desc:"Тауық, қаз, үйрекке арналған толық витаминді жем.",price:"9 200 ₸ / 25кг"}
];
const meds = [
  {name:"Ветеринарлық витамин ерітіндісі",desc:"Иммунитетті нығайтуға, инъекция түрінде.",price:"4 500 ₸"},
  {name:"Дегельминтизацияға арналған дәрі",desc:"Ішек құрттарына қарсы, барлық мал түріне.",price:"3 200 ₸"},
  {name:"Тұяқ дезинфекциялау құралы",desc:"Тұяқ ауруларының алдын алуға арналған.",price:"2 800 ₸"}
];
const coops = [
  {name:"Тауыққа арналған үйшік (10 басқа)",desc:"Ағаштан жасалған, жылытылған, төбесі су өткізбейді.",price:"85 000 ₸"},
  {name:"Ұя-жұмыртқа жинау қобдишасы",desc:"5 бөлмелі, тазалауға ыңғайлы.",price:"14 000 ₸"},
  {name:"Автоматты су беру құралы",desc:"Құстарға арналған, 8л сыйымдылық.",price:"6 500 ₸"}
];
let userProducts = []; // {tag, tagText, name, desc, price, loc, seller}

let user = null; // {name, phone}
const cats = ["Барлығы","Сиыр","Қой","Жылқы","Тауық","Қаз","Үйрек","Қоян"];
let activeCat = "Барлығы";
let postKind = "animal"; // "animal" | "product"

const tagLabels = {"tag-good":"ЖЕМ · САПАЛЫ","tag-budget":"ЖЕМ · ҚОЛЖЕТІМДІ","tag-med":"ДӘРІ-ДӘРМЕК","tag-coop":"ҚҰРАЛ-ЖАБДЫҚ"};

/* ---------- RENDER ---------- */
function renderCatbar(){
  const el = document.getElementById('catbar');
  el.innerHTML = cats.map(c=>{
    const ic = c==="Барлығы" ? '' : `<div style="width:16px;height:16px">${icons[c]}</div>`;
    return `<div class="chip ${c===activeCat?'active':''}" onclick="setCat('${c}')">${ic}${escapeHTML(c)}</div>`;
  }).join('');
}
function setCat(c){ activeCat = c; renderCatbar(); renderListings(); }

function renderListings(){
  const filtered = activeCat==="Барлығы" ? listings : listings.filter(l=>l.type===activeCat);
  document.getElementById('listCount').textContent = activeCat==="Барлығы" ? `Барлық хабарландырулар (${filtered.length})` : `${activeCat} — ${filtered.length} хабарландыру`;
  const list = document.getElementById('listingsList');
  if(filtered.length===0){
    list.innerHTML = `<div class="empty-note">Бұл санатта әзірше хабарландыру жоқ. Бірінші болып жариялаңыз!</div>`;
    return;
  }
  list.innerHTML = filtered.map((l)=>`
    <div class="row-card">
      <div class="row-icon" style="background:${catColors[l.type]}18;">${iconChip(l.type)}</div>
      <div class="row-body">
        <div class="row-title">${escapeHTML(l.title)}</div>
        <div class="row-meta"><span>📍 ${escapeHTML(l.loc)}</span><span>👤 ${escapeHTML(l.seller)}</span></div>
      </div>
      <div class="row-actions">
        <div class="row-price">${Number(l.price).toLocaleString('ru-RU')} ₸</div>
        <button class="btn btn-sky btn-small" onclick="openCall(${listings.indexOf(l)})">📞 Қоңырау шалу</button>
      </div>
    </div>
  `).join('');
}

function renderProducts(){
  document.getElementById('feedGrid').innerHTML = feed.map(p=>`
    <div class="prod-card"><span class="prod-tag ${p.tag}">${p.tagText}</span>
      <div class="prod-name">${escapeHTML(p.name)}</div><div class="prod-desc">${escapeHTML(p.desc)}</div>
      <div class="prod-price">${escapeHTML(p.price)}</div></div>`).join('');
  document.getElementById('medGrid').innerHTML = meds.map(p=>`
    <div class="prod-card"><span class="prod-tag tag-med">ДӘРІ-ДӘРМЕК</span>
      <div class="prod-name">${escapeHTML(p.name)}</div><div class="prod-desc">${escapeHTML(p.desc)}</div>
      <div class="prod-price">${escapeHTML(p.price)}</div></div>`).join('');
  document.getElementById('coopGrid').innerHTML = coops.map(p=>`
    <div class="prod-card"><span class="prod-tag tag-budget">ҚҰРАЛ-ЖАБДЫҚ</span>
      <div class="prod-name">${escapeHTML(p.name)}</div><div class="prod-desc">${escapeHTML(p.desc)}</div>
      <div class="prod-price">${escapeHTML(p.price)}</div></div>`).join('');

  const upGrid = document.getElementById('userProdGrid');
  const upEmpty = document.getElementById('userProdEmpty');
  if(userProducts.length===0){
    upGrid.innerHTML = '';
    upEmpty.style.display = 'block';
  }else{
    upEmpty.style.display = 'none';
    upGrid.innerHTML = userProducts.map(p=>`
      <div class="prod-card"><span class="prod-tag ${p.tag}">${tagLabels[p.tag]}</span>
        <div class="prod-name">${escapeHTML(p.name)}</div><div class="prod-desc">${escapeHTML(p.desc)}</div>
        <div class="prod-price">${escapeHTML(p.price)}</div>
        <div class="prod-meta">📍 ${escapeHTML(p.loc)} · 👤 ${escapeHTML(p.seller)}</div>
      </div>`).join('');
  }
}

/* ---------- TABS ---------- */
function switchTab(tab){
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active', t.dataset.tab===tab));
  document.getElementById('animalsView').style.display = tab==='animals' ? 'block':'none';
  document.getElementById('productsView').style.display = tab==='products' ? 'block':'none';
}

/* ---------- POST KIND TOGGLE ---------- */
function setPostKind(kind){
  postKind = kind;
  document.querySelectorAll('#postKindSeg .seg-btn').forEach(b=>b.classList.toggle('active', b.dataset.kind===kind));
  document.getElementById('animalFields').style.display = kind==='animal' ? 'block':'none';
  document.getElementById('productFields').style.display = kind==='product' ? 'block':'none';
}

/* ---------- MODALS ---------- */
function openModal(id){
  if(id==='postModal' && !user){ closeModal('postModal'); openModal('registerModal'); showToast('Алдымен тіркелу қажет'); return; }
  if(id==='postModal'){
    // формасы бос ашылады
    ['postTitle','postDesc','postPrice','postLoc','prodTitle','prodDesc','prodPrice','prodLoc'].forEach(i=>{
      const el = document.getElementById(i); if(el) el.value='';
    });
    resetPhoneField('postPhone');
    setPostKind('animal');
  }
  if(id==='registerModal'){
    telegramPhone = "";
    document.getElementById('regStep1').classList.remove('step-hidden');
    document.getElementById('regStep2').classList.add('step-hidden');
    document.getElementById('tgCodeInput').value = '';
    document.getElementById('regName').value = '';
  }
  document.getElementById(id).classList.add('show');
}
function closeModal(id){ document.getElementById(id).classList.remove('show'); }

function openCall(idx){
  const l = listings[idx];
  document.getElementById('callNumber').textContent = l.phone;
  document.getElementById('callSeller').textContent = 'Сатушы: ' + l.seller + ' — ' + l.title;
  document.getElementById('callLink').href = 'tel:' + l.phone.replace(/\s/g,'');
  openModal('callModal');
}

/* ---------- REGISTER FLOW (Telegram bot арқылы, тегін, дерекқорсыз) ---------- */
let telegramPhone = "";

async function verifyTelegramCode(){
  const raw = document.getElementById('tgCodeInput').value.trim();
  if(!raw){ showToast('Telegram-нан алған кодты қойыңыз'); return; }

  const btn = document.getElementById('tgVerifyBtn');
  if(btn){ btn.disabled = true; btn.textContent = 'Тексерілуде...'; }

  try{
    const res = await fetch('/.netlify/functions/telegram-verify', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ token: raw })
    });
    const data = await res.json();
    if(!data.ok){
      showToast(data.message || 'Код қате');
      return;
    }
    telegramPhone = data.phone;
    document.getElementById('regStep1').classList.add('step-hidden');
    document.getElementById('regStep2').classList.remove('step-hidden');
    document.getElementById('tgVerifiedPhone').textContent = telegramPhone;
    showToast('Telegram арқылы нөмір расталды!');
  }catch(err){
    showToast('Байланыс қатесі, қайталап көріңіз');
  }finally{
    if(btn){ btn.disabled = false; btn.textContent = 'Тексеру'; }
  }
}

function finishRegister(){
  const name = document.getElementById('regName').value.trim();
  if(!name){ showToast('Аты-жөніңізді енгізіңіз'); return; }
  if(!telegramPhone){ showToast('Алдымен Telegram арқылы нөміріңізді растаңыз'); return; }
  user = {name, phone: telegramPhone};
  updateHeader();
  closeModal('registerModal');
  showToast('Қош келдіңіз, ' + name + '!');
}
function updateHeader(){
  const el = document.getElementById('headActions');
  if(user){
    const initials = user.name.split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase();
    el.innerHTML = `<div class="user-chip"><div class="avatar">${escapeHTML(initials)}</div>${escapeHTML(user.name.split(' ')[0])}</div>
      <button class="btn btn-primary" onclick="openModal('postModal')">+ Хабарландыру беру</button>`;
  }
}

/* ---------- POST LISTING (мал немесе өнім) ---------- */
function submitPost(){
  const phone = document.getElementById('postPhone').value.trim();
  if(phone.replace(/\D/g,'').length < 11){ showToast('Телефон нөмірін толық енгізіңіз'); return; }

  if(postKind === 'animal'){
    const type = document.getElementById('postType').value;
    const title = document.getElementById('postTitle').value.trim();
    const desc = document.getElementById('postDesc').value.trim();
    const price = parseInt(document.getElementById('postPrice').value);
    const loc = document.getElementById('postLoc').value.trim();
    if(!title || !price || !loc){ showToast('Барлық өрісті толтырыңыз'); return; }
    listings.unshift({type, title, desc, price, loc, seller: user.name, phone});
    activeCat = "Барлығы"; renderCatbar(); switchTab('animals'); renderListings();
    showToast('Хабарландыру жарияланды!');
  } else {
    const tag = document.getElementById('prodCat').value;
    const name = document.getElementById('prodTitle').value.trim();
    const desc = document.getElementById('prodDesc').value.trim();
    const price = document.getElementById('prodPrice').value.trim();
    const loc = document.getElementById('prodLoc').value.trim();
    if(!name || !price || !loc){ showToast('Барлық өрісті толтырыңыз'); return; }
    userProducts.unshift({tag, tagText: tagLabels[tag], name, desc, price, loc, seller: user.name, phone});
    switchTab('products'); renderProducts();
    showToast('Өнім/құрал жарияланды!');
  }
  closeModal('postModal');
}

/* ---------- TOAST ---------- */
let toastTimer;
function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.classList.remove('show'), 2600);
}

/* ---------- INIT ---------- */
attachPhoneMask(document.getElementById('postPhone'));
resetPhoneField('postPhone');
renderCatbar(); renderListings(); renderProducts();
