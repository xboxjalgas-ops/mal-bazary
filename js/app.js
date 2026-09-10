/* =========================================================
   Мал Базары — frontend logic
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

/* ---------- DATA (Supabase дерекқорынан жүктеледі) ---------- */
let listings = [];
let dataLoaded = false;

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
let userProducts = []; // Supabase-тен жүктеледі: {tag, tagText, name, desc, price, loc, seller, phone}

function normalizeListing(row){
  return {
    id: row.id, type: row.type, title: row.title, desc: row.description || '',
    price: row.price, loc: row.location, seller: row.seller_name, phone: row.seller_phone,
    avatar: row.seller_avatar || null, createdAt: row.created_at
  };
}
function normalizeProduct(row){
  return {
    id: row.id, tag: row.category, tagText: tagLabels[row.category] || '', name: row.name,
    desc: row.description || '', price: row.price, loc: row.location,
    seller: row.seller_name, phone: row.seller_phone, avatar: row.seller_avatar || null,
    createdAt: row.created_at
  };
}

async function loadListings(){
  try{
    const res = await fetch('/api/get-data?type=listings');
    const data = await res.json();
    if(data.ok){ listings = data.listings.map(normalizeListing); }
  }catch(err){ /* желі болмаса — бос тізіммен қалады */ }
  renderListings();
}

async function loadUserProducts(){
  try{
    const res = await fetch('/api/get-data?type=products');
    const data = await res.json();
    if(data.ok){ userProducts = data.products.map(normalizeProduct); }
  }catch(err){ /* желі болмаса — бос тізіммен қалады */ }
  renderProducts();
}

let user = null; // {name, phone}
const cats = ["Барлығы","Сиыр","Қой","Жылқы","Тауық","Қаз","Үйрек","Қоян"];
let activeCat = "Барлығы";
let postKind = "animal"; // "animal" | "product"
let searchQuery = "";
let sortMode = "newest";
let favoritesOnly = false;
const FAVORITES_KEY = "mb_favorites";

function getFavorites(){
  try{ return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]"); }catch(e){ return []; }
}
function isFavorite(id){ return getFavorites().includes(String(id)); }
function toggleFavorite(id){
  id = String(id);
  let favs = getFavorites();
  favs = favs.includes(id) ? favs.filter(x=>x!==id) : [...favs, id];
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
  renderListings();
}
function toggleFavoritesOnly(){
  favoritesOnly = !favoritesOnly;
  document.getElementById('favToggleBtn').classList.toggle('active', favoritesOnly);
  document.getElementById('favToggleBtn').textContent = favoritesOnly ? '★ Таңдаулылар' : '☆ Таңдаулылар';
  renderListings();
}
function onSearchInput(){
  searchQuery = document.getElementById('searchInput').value.trim().toLowerCase();
  renderListings();
}
function onSortChange(){
  sortMode = document.getElementById('sortSelect').value;
  renderListings();
}
function isNewItem(createdAt){
  if(!createdAt) return false;
  return (Date.now() - new Date(createdAt).getTime()) < 24*60*60*1000;
}

async function deleteListing(id){
  if(!confirm('Хабарландыруды өшіруге сенімдісіз бе?')) return;
  try{
    const res = await apiFetch('/api/delete-post', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ kind:'listing', id })
    });
    const data = await res.json();
    if(!data.ok){ showToast(data.message || 'Өшірілмеді'); return; }
    showToast('Хабарландыру өшірілді');
    await loadListings();
  }catch(err){ showToast('Байланыс қатесі'); }
}

async function deleteProduct(id){
  if(!confirm('Өшіруге сенімдісіз бе?')) return;
  try{
    const res = await apiFetch('/api/delete-post', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ kind:'product', id })
    });
    const data = await res.json();
    if(!data.ok){ showToast(data.message || 'Өшірілмеді'); return; }
    showToast('Өшірілді');
    await loadUserProducts();
  }catch(err){ showToast('Байланыс қатесі'); }
}

const tagLabels = {"tag-good":"ЖЕМ · САПАЛЫ","tag-budget":"ЖЕМ · ҚОЛЖЕТІМДІ","tag-med":"ДӘРІ-ДӘРМЕК","tag-coop":"ҚҰРАЛ-ЖАБДЫҚ"};

/* ---------- RENDER ---------- */
function renderCatbar(){
  const el = document.getElementById('catbar');
  el.innerHTML = cats.map(c=>{
    const ic = c==="Барлығы" ? '' : `<div style="width:16px;height:16px">${icons[c]}</div>`;
    return `<button type="button" class="chip ${c===activeCat?'active':''}" onclick="setCat('${c}')">${ic}${escapeHTML(c)}</button>`;
  }).join('');
}
function setCat(c){ activeCat = c; renderCatbar(); renderListings(); }

function renderListings(){
  let filtered = activeCat==="Барлығы" ? listings.slice() : listings.filter(l=>l.type===activeCat);

  if(searchQuery){
    filtered = filtered.filter(l =>
      l.title.toLowerCase().includes(searchQuery) ||
      (l.desc && l.desc.toLowerCase().includes(searchQuery)) ||
      l.loc.toLowerCase().includes(searchQuery)
    );
  }
  if(favoritesOnly){
    filtered = filtered.filter(l => isFavorite(l.id));
  }
  if(sortMode === "price-asc"){ filtered.sort((a,b)=>Number(a.price)-Number(b.price)); }
  else if(sortMode === "price-desc"){ filtered.sort((a,b)=>Number(b.price)-Number(a.price)); }
  else { filtered.sort((a,b)=> new Date(b.createdAt||0) - new Date(a.createdAt||0)); }

  document.getElementById('listCount').textContent = activeCat==="Барлығы" ? `Барлық хабарландырулар (${filtered.length})` : `${activeCat} — ${filtered.length} хабарландыру`;
  const list = document.getElementById('listingsList');
  if(filtered.length===0){
    list.innerHTML = `<div class="empty-note">Ештеңе табылмады. Іздеуді немесе санатты өзгертіп көріңіз.</div>`;
    return;
  }
  list.innerHTML = filtered.map((l)=>{
    const isOwn = user && user.phone === l.phone;
    return `
    <div class="row-card">
      <div class="row-icon" style="background:${catColors[l.type]}18;">${iconChip(l.type)}</div>
      <div class="row-body">
        <div class="row-title">${escapeHTML(l.title)}${isNewItem(l.createdAt) ? '<span class="badge-new">Жаңа</span>' : ''}</div>
        <div class="row-meta"><span>📍 ${escapeHTML(l.loc)}</span><span>${l.avatar ? `<img src="${escapeHTML(l.avatar)}" alt="" style="width:14px;height:14px;border-radius:50%;object-fit:cover;vertical-align:-2px;margin-right:2px;">` : "👤 "}${escapeHTML(l.seller)}</span></div>
      </div>
      <div class="row-actions">
        <div class="row-icon-actions">
          <button class="icon-btn ${isFavorite(l.id)?'fav-active':''}" onclick="toggleFavorite('${l.id}')" title="Таңдаулыға қосу">${isFavorite(l.id)?'★':'☆'}</button>
          ${isOwn ? `<button class="icon-btn" onclick="deleteListing('${l.id}')" title="Өшіру">🗑</button>` : ''}
        </div>
        <div class="row-price">${Number(l.price).toLocaleString('ru-RU')} ₸</div>
        <button class="btn btn-sky btn-small" onclick="openCall(${listings.indexOf(l)})">📞 Қоңырау шалу</button>
      </div>
    </div>
  `;}).join('');
}

function productCard(p){
  const isOwn = user && user.phone === p.phone;
  return `<div class="prod-card">
    <span class="prod-tag ${p.tag}">${escapeHTML(tagLabels[p.tag] || 'ӨНІМ')}</span>${isNewItem(p.createdAt) ? '<span class="badge-new">Жаңа</span>' : ''}
    <div class="prod-name">${escapeHTML(p.name)}</div>
    <div class="prod-desc">${escapeHTML(p.desc)}</div>
    <div class="prod-price">${escapeHTML(p.price)}</div>
    <div class="prod-meta">📍 ${escapeHTML(p.loc)} · ${p.avatar ? `<img src="${escapeHTML(p.avatar)}" alt="" style="width:14px;height:14px;border-radius:50%;object-fit:cover;vertical-align:-2px;margin-right:2px;">` : "👤 "}${escapeHTML(p.seller)}</div>
    <div class="product-actions">
      <button class="btn btn-sky btn-small" onclick="openProductCall('${p.id}')">📞 Қоңырау шалу</button>
      ${isOwn ? `<button class="icon-btn icon-btn-wide" onclick="deleteProduct('${p.id}')" title="Өшіру">🗑 Өшіру</button>` : ''}
    </div>
  </div>`;
}
function renderProducts(){
  const groups = {
    feedGrid: userProducts.filter(p=>p.tag==='tag-good' || p.tag==='tag-budget'),
    medGrid: userProducts.filter(p=>p.tag==='tag-med'),
    coopGrid: userProducts.filter(p=>p.tag==='tag-coop')
  };
  Object.entries(groups).forEach(([id, items])=>{
    document.getElementById(id).innerHTML = items.length ? items.map(productCard).join('') : '<div class="empty-note">Бұл санатта әзірше хабарландыру жоқ.</div>';
  });
}
function openProductCall(id){
  const p = userProducts.find(item=>String(item.id)===String(id));
  if(!p) return;
  document.getElementById('callNumber').textContent = p.phone;
  document.getElementById('callSeller').textContent = 'Сатушы: ' + p.seller + ' — ' + p.name;
  document.getElementById('callLink').href = 'tel:' + p.phone.replace(/\s/g,'');
  openModal('callModal');
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
let lastFocusedElement = null;
function openModal(id){
  if(id==='postModal' && !user){ closeModal('postModal'); openModal('registerModal'); showToast('Алдымен тіркелу қажет'); return; }
  if(id==='postModal'){
    // формасы бос ашылады
    ['postTitle','postDesc','postPrice','postLoc','prodTitle','prodDesc','prodPrice','prodLoc'].forEach(i=>{
      const el = document.getElementById(i); if(el) el.value='';
    });
    setPostKind('animal');
  }
  if(id==='registerModal'){
    telegramPhone = "";
    document.getElementById('regStep1').classList.remove('step-hidden');
    document.getElementById('regStep2').classList.add('step-hidden');
    document.getElementById('tgCodeInput').value = '';
    document.getElementById('regName').value = '';
  }
  lastFocusedElement = document.activeElement;
  const modal = document.getElementById(id);
  modal.classList.add('show');
  requestAnimationFrame(()=>modal.querySelector('button, a, input, select, textarea')?.focus());
}
function closeModal(id){
  document.getElementById(id).classList.remove('show');
  lastFocusedElement?.focus?.();
}
document.addEventListener('keydown', e=>{
  if(e.key === 'Escape') document.querySelectorAll('.overlay.show').forEach(m=>closeModal(m.id));
});
document.querySelectorAll('.overlay').forEach(m=>m.addEventListener('click', e=>{ if(e.target===m) closeModal(m.id); }));

function openCall(idx){
  const l = listings[idx];
  document.getElementById('callNumber').textContent = l.phone;
  document.getElementById('callSeller').textContent = 'Сатушы: ' + l.seller + ' — ' + l.title;
  document.getElementById('callLink').href = 'tel:' + l.phone.replace(/\s/g,'');
  openModal('callModal');
}

/* ---------- REGISTER FLOW (Telegram bot арқылы, тегін, дерекқорсыз) ---------- */
let telegramPhone = "";
const SESSION_KEY = "mb_session";
function sessionToken(){ return localStorage.getItem(SESSION_KEY) || ''; }
function apiFetch(url, options = {}){
  const headers = { ...(options.headers || {}) };
  const token = sessionToken();
  if(token) headers.Authorization = `Bearer ${token}`;
  return fetch(url, { ...options, headers });
}

async function verifyTelegramCode(){
  const raw = document.getElementById('tgCodeInput').value.trim();
  if(!raw){ showToast('Telegram-нан алған кодты қойыңыз'); return; }

  const btn = document.getElementById('tgVerifyBtn');
  if(btn){ btn.disabled = true; btn.textContent = 'Тексерілуде...'; }

  try{
    const res = await fetch('/api/telegram-verify', {
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

    // Бұл нөмір бұрын тіркелген бе, тексереміз — солай болса, аты-жөнін
    // қайта сұрамай-ақ, бірден тіркелуді аяқтаймыз.
    localStorage.setItem(SESSION_KEY, data.sessionToken);
    const userRes = await apiFetch('/api/user');
    const userData = await userRes.json();

    if(userData.ok && userData.exists){
      await completeLogin(telegramPhone, userData.name, userData.avatar_url, data.sessionToken);
      showToast('Қайта келуіңізбен, ' + userData.name + '!');
    } else {
      document.getElementById('regStep1').classList.add('step-hidden');
      document.getElementById('regStep2').classList.remove('step-hidden');
      document.getElementById('tgVerifiedPhone').textContent = telegramPhone;
      showToast('Telegram арқылы нөмір расталды!');
    }
  }catch(err){
    showToast('Байланыс қатесі, қайталап көріңіз');
  }finally{
    if(btn){ btn.disabled = false; btn.textContent = 'Тексеру'; }
  }
}

async function finishRegister(){
  const name = document.getElementById('regName').value.trim();
  if(!name){ showToast('Аты-жөніңізді енгізіңіз'); return; }
  if(!telegramPhone){ showToast('Алдымен Telegram арқылы нөміріңізді растаңыз'); return; }

  try{
    const res = await apiFetch('/api/user', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ name })
    });
    const data = await res.json();
    if(!data.ok){ showToast(data.message || 'Қате шықты'); return; }

    await completeLogin(telegramPhone, data.name);
    showToast('Қош келдіңіз, ' + data.name + '!');
  }catch(err){
    showToast('Байланыс қатесі, қайталап көріңіз');
  }
}

// Тіркелу/кіру сәтті болған соң: user күйін орнатып, ұзақ мерзімді
// сессия токенін алып, localStorage-ке сақтайды (келесі жолы Telegram
// арқылы қайта растаудың қажеті болмайды).
async function completeLogin(phone, name, avatarUrl, token){
  if(token) localStorage.setItem(SESSION_KEY, token);
  user = { name, phone, avatarUrl: avatarUrl || null };
  updateHeader();
  closeModal('registerModal');
  renderListings(); renderProducts();
}

async function restoreSession(){
  const token = localStorage.getItem(SESSION_KEY);
  if(!token) return;
  try{
    const res = await fetch('/api/session', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ action:'verify', token })
    });
    const data = await res.json();
    if(!data.ok){ localStorage.removeItem(SESSION_KEY); return; }
    const userRes = await apiFetch('/api/user');
    const userData = await userRes.json();
    if(userData.ok && userData.exists){
      user = { name: userData.name, phone: data.phone, avatarUrl: userData.avatar_url || null };
      updateHeader();
      renderListings(); renderProducts();
    }
  }catch(err){}
}

function logout(){
  user = null;
  localStorage.removeItem(SESSION_KEY);
  closeModal('profileModal');
  document.getElementById('headActions').innerHTML = `<button class="btn btn-ghost btn-small" onclick="openModal('registerModal')">Тіркелу</button>
    <button class="btn btn-primary" onclick="openModal('postModal')">+ <span class="full-label">Хабарландыру беру</span></button>`;
  showToast('Шықтыңыз');
  renderListings(); renderProducts();
}

function switchAccount(){
  user = null;
  localStorage.removeItem(SESSION_KEY);
  closeModal('profileModal');
  document.getElementById('headActions').innerHTML = `<button class="btn btn-ghost btn-small" onclick="openModal('registerModal')">Тіркелу</button>
    <button class="btn btn-primary" onclick="openModal('postModal')">+ <span class="full-label">Хабарландыру беру</span></button>`;
  openModal('registerModal');
  renderListings(); renderProducts();
}

function avatarHTML(avatarUrl, initials){
  return avatarUrl ? `<img src="${escapeHTML(avatarUrl)}" alt="">` : escapeHTML(initials);
}

function updateHeader(){
  const el = document.getElementById('headActions');
  if(user){
    const initials = user.name.split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase();
    el.innerHTML = `<div class="user-chip" style="cursor:pointer;" onclick="openProfileModal()" title="Профиль"><div class="avatar">${avatarHTML(user.avatarUrl, initials)}</div>${escapeHTML(user.name.split(' ')[0])}</div>
      <button class="btn btn-primary" onclick="openModal('postModal')">+ <span class="full-label">Хабарландыру беру</span></button>`;
  }
}

/* ---------- ТЕМА ---------- */
const THEME_KEY = "mb_theme";
function setTheme(theme){
  const t = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem(THEME_KEY, t);
  const lightSw = document.getElementById('themeSwatchLight');
  const darkSw = document.getElementById('themeSwatchDark');
  if(lightSw && darkSw){
    lightSw.classList.toggle('active', t !== 'dark');
    darkSw.classList.toggle('active', t === 'dark');
  }
  const sun = document.getElementById('themeIconSun');
  const moon = document.getElementById('themeIconMoon');
  if(sun && moon){
    sun.style.display = t === 'dark' ? 'none' : 'block';
    moon.style.display = t === 'dark' ? 'block' : 'none';
  }
}
function toggleTheme(){
  const cur = localStorage.getItem(THEME_KEY) || 'light';
  setTheme(cur === 'dark' ? 'light' : 'dark');
}
function initTheme(){
  setTheme(localStorage.getItem(THEME_KEY) || 'light');
}

/* ---------- ПРОФИЛЬ МОДАЛЫ ---------- */
function openProfileModal(){
  if(!user) return;
  const initials = user.name.split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase();
  document.getElementById('profileAvatarBox').innerHTML = avatarHTML(user.avatarUrl, initials);
  document.getElementById('profileName').textContent = user.name;
  document.getElementById('profilePhone').textContent = user.phone;
  const saved = localStorage.getItem(THEME_KEY) || 'light';
  document.getElementById('themeSwatchLight').classList.toggle('active', saved !== 'dark');
  document.getElementById('themeSwatchDark').classList.toggle('active', saved === 'dark');
  openModal('profileModal');
}

function handleAvatarChange(event){
  const file = event.target.files && event.target.files[0];
  if(!file || !user) return;
  const reader = new FileReader();
  reader.onload = function(e){
    const img = new Image();
    img.onload = function(){
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d');
      const scale = Math.max(size / img.width, size / img.height);
      const w = img.width * scale, h = img.height * scale;
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
      canvas.toBlob(async function(blob){
        const buf = await blob.arrayBuffer();
        let binary = '';
        const bytes = new Uint8Array(buf);
        for(let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        await uploadAvatar(btoa(binary), 'image/jpeg');
      }, 'image/jpeg', 0.85);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function uploadAvatar(base64, mimeType){
  showToast('Сурет жүктелуде...');
  try{
    const res = await apiFetch('/api/upload-avatar', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ imageBase64: base64, mimeType })
    });
    const data = await res.json();
    if(!data.ok){ showToast(data.message || 'Сурет жүктелмеді'); return; }
    user.avatarUrl = data.avatar_url;
    updateHeader();
    const initials = user.name.split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase();
    document.getElementById('profileAvatarBox').innerHTML = avatarHTML(user.avatarUrl, initials);
    showToast('Сурет жаңартылды!');
  }catch(err){
    showToast('Байланыс қатесі, қайталап көріңіз');
  }
}

/* ---------- POST LISTING (мал немесе өнім) — Supabase-ке жазады ---------- */
async function submitPost(){
  const submitBtn = document.querySelector('#postModal .full-btn');
  if(submitBtn){ submitBtn.disabled = true; submitBtn.textContent = 'Жариялануда...'; }

  try{
    if(postKind === 'animal'){
      const type = document.getElementById('postType').value;
      const title = document.getElementById('postTitle').value.trim();
      const desc = document.getElementById('postDesc').value.trim();
      const price = parseInt(document.getElementById('postPrice').value);
      const loc = document.getElementById('postLoc').value.trim();
      if(!title || !price || !loc){ showToast('Барлық өрісті толтырыңыз'); return; }

      const res = await apiFetch('/api/create-post', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ kind:'listing', type, title, description: desc, price, location: loc })
      });
      const data = await res.json();
      if(!data.ok){ showToast(data.message || 'Қате шықты'); return; }

      activeCat = "Барлығы"; renderCatbar(); switchTab('animals');
      await loadListings();
      showToast('Хабарландыру жарияланды!');
    } else {
      const tag = document.getElementById('prodCat').value;
      const name = document.getElementById('prodTitle').value.trim();
      const desc = document.getElementById('prodDesc').value.trim();
      const price = document.getElementById('prodPrice').value.trim();
      const loc = document.getElementById('prodLoc').value.trim();
      if(!name || !price || !loc){ showToast('Барлық өрісті толтырыңыз'); return; }

      const res = await apiFetch('/api/create-post', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ kind:'product', category: tag, name, description: desc, price, location: loc })
      });
      const data = await res.json();
      if(!data.ok){ showToast(data.message || 'Қате шықты'); return; }

      switchTab('products');
      await loadUserProducts();
      showToast('Өнім/құрал жарияланды!');
    }
    closeModal('postModal');
  }catch(err){
    showToast('Байланыс қатесі, қайталап көріңіз');
  }finally{
    if(submitBtn){ submitBtn.disabled = false; submitBtn.textContent = 'Жариялау'; }
  }
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
initTheme();
renderCatbar();
loadListings();
loadUserProducts();
renderProducts();
restoreSession();
