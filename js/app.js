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
    avatar: row.seller_avatar || null, images: Array.isArray(row.images) ? row.images : [],
    status: row.status || 'active', createdAt: row.created_at, updatedAt: row.updated_at, sellerAuthId: row.seller_auth_id || null, sellerVerified: Boolean(row.seller_verified), sellerShopName: row.seller_shop_name || '', sellerRating: Number(row.seller_rating || 0), sellerReviewCount: Number(row.seller_review_count || 0), animalDetails: row.animal_details || {}
  };
}
function normalizeProduct(row){
  return {
    id: row.id, tag: row.category, tagText: tagLabels[row.category] || '', name: row.name,
    desc: row.description || '', price: row.price, loc: row.location,
    seller: row.seller_name, phone: row.seller_phone, avatar: row.seller_avatar || null, sellerAuthId: row.seller_auth_id || null, sellerVerified: Boolean(row.seller_verified), sellerShopName: row.seller_shop_name || '', sellerRating: Number(row.seller_rating || 0), sellerReviewCount: Number(row.seller_review_count || 0),
    images: Array.isArray(row.images) ? row.images : [], createdAt: row.created_at
  };
}

async function loadListings(){
  window.mbSkeleton?.('listingsList', 4);
  try{
    const res = await fetch('/api/get-data?type=listings');
    const data = await res.json();
    if(data.ok){ listings = data.listings.map(normalizeListing); }
  }catch(err){ /* желі болмаса — бос тізіммен қалады */ }
  renderListings();
  window.mbLoaded?.('listingsList');
}

async function loadUserProducts(){
  ['feedGrid','medGrid','coopGrid'].forEach(id=>window.mbSkeleton?.(id, 2));
  try{
    const res = await fetch('/api/get-data?type=products');
    const data = await res.json();
    if(data.ok){ userProducts = data.products.map(normalizeProduct); }
  }catch(err){ /* желі болмаса — бос тізіммен қалады */ }
  renderProducts();
  ['feedGrid','medGrid','coopGrid'].forEach(id=>window.mbLoaded?.(id));
}

let user = null; // {name, phone}
const cats = ["Барлығы","Сиыр","Қой","Жылқы","Тауық","Қаз","Үйрек","Қоян"];
let activeCat = "Барлығы";
let postKind = "animal"; // "animal" | "product"
let editingListingId = null;
let selectedListingFiles = [];
let existingListingImages = [];
let selectedProductFiles = [];
let searchQuery = "";
let sortMode = "newest";
let favoritesOnly = false;
const FAVORITES_KEY = "mb_favorites";

function getFavorites(){
  try{ return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]"); }catch(e){ return []; }
}
function isFavorite(id){ return getFavorites().includes(String(id)); }
function saveFavorites(favorites){
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...new Set(favorites.map(String))]));
}
async function syncFavorites(){
  if(!user)return;
  try{
    const local=getFavorites();
    const response=await apiFetch('/api/preferences');
    const data=await response.json();
    if(!response.ok||!data.ok)return;
    const remote=Array.isArray(data.favorites)?data.favorites.map(String):[];
    const merged=[...new Set([...remote,...local])];
    saveFavorites(merged);
    renderListings();
    for(const listingId of local.filter(id=>!remote.includes(String(id)))){
      await apiFetch('/api/preferences',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({listing_id:String(listingId),favorite:true})});
    }
  }catch{/* Желі қалпына келгенде келесі кіруде қайта синхрондалады. */}
}
async function toggleFavorite(id){
  id = String(id);
  let favs = getFavorites();
  const favorite=!favs.includes(id);
  favs = favorite ? [...favs, id] : favs.filter(x=>x!==id);
  saveFavorites(favs);
  renderListings();
  if(user){
    try{
      const response=await apiFetch('/api/preferences',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({listing_id:id,favorite})});
      if(!response.ok)throw new Error('sync');
    }catch{
      showToast('Таңдаулы құрылғыда сақталды, синхрондау кейін жалғасады');
    }
  }
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

const animalPhotos={"Сиыр":"cow","Қой":"sheep","Жылқы":"horse","Тауық":"chicken","Қаз":"goose","Үйрек":"duck","Қоян":"rabbit"};
const productPhotos={"tag-good":"feed","tag-budget":"feed","tag-med":"medicine","tag-coop":"equipment"};
function animalPhoto(type,title){const file=animalPhotos[type];return file?`<img class="listing-thumb placeholder-photo" src="assets/home/${file}.svg" alt="${escapeHTML(title||type)}">`:iconChip(type);}
const tagLabels = {"tag-good":"ЖЕМ · САПАЛЫ","tag-budget":"ЖЕМ · ҚОЛЖЕТІМДІ","tag-med":"ДӘРІ-ДӘРМЕК","tag-coop":"ҚҰРАЛ-ЖАБДЫҚ"};

/* ---------- RENDER ---------- */
function renderCatbar(){
  const el = document.getElementById('catbar');
  el.innerHTML = cats.map(c=>{
    const ic = c==="Барлығы" ? '' : `<img class="cat-photo-icon" src="assets/home/${animalPhotos[c]}.svg" alt="">`;
    return `<button type="button" class="chip ${c===activeCat?'active':''}" onclick="setCat('${c}')">${ic}${escapeHTML(c)}</button>`;
  }).join('');
}
function setCat(c){ activeCat = c; renderCatbar(); renderListings(); }

function listingUrl(id){return `${location.origin}/listing.html?id=${encodeURIComponent(id)}`;}
function shareListing(id){
  const l=listings.find(x=>String(x.id)===String(id));if(!l)return;
  const url=listingUrl(l.id),text=`${l.title} — ${Number(l.price).toLocaleString('ru-RU')} ₸, ${l.loc}`;
  const whatsappUrl=`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
  window.open(whatsappUrl,'_blank','noopener');
}
function renderPriceStats(){
  const box=document.getElementById('priceStats');if(!box)return;
  const groups=(activeCat==='Барлығы'?cats.slice(1):[activeCat]).map(type=>{
    const prices=listings.filter(l=>l.type===type&&l.status!=='sold'&&Number(l.price)>0).map(l=>Number(l.price));
    if(!prices.length)return null;const avg=Math.round(prices.reduce((a,b)=>a+b,0)/prices.length);
    return {type,avg,min:Math.min(...prices),max:Math.max(...prices),count:prices.length};
  }).filter(Boolean);
  box.innerHTML=groups.length?groups.map(g=>`<article class="price-stat"><b>${escapeHTML(g.type)}</b><strong>${g.avg.toLocaleString('ru-RU')} ₸</strong><span>${g.count} хабарландыру · ${g.min.toLocaleString('ru-RU')}–${g.max.toLocaleString('ru-RU')} ₸</span></article>`).join(''):'<div class="empty-note">Статистика үшін белсенді хабарландыру қажет.</div>';
}
function renderListings(){
  let filtered = activeCat==="Барлығы" ? listings.slice() : listings.filter(l=>l.type===activeCat);
  if(searchQuery) filtered=filtered.filter(l=>l.title.toLowerCase().includes(searchQuery)||(l.desc&&l.desc.toLowerCase().includes(searchQuery))||l.loc.toLowerCase().includes(searchQuery));
  if(favoritesOnly) filtered=filtered.filter(l=>isFavorite(l.id));
  if(typeof filterRegion!=='undefined'&&filterRegion)filtered=filtered.filter(l=>l.loc.toLowerCase().includes(filterRegion.replace(' облысы','')));
  if(typeof filterLocation!=='undefined'&&filterLocation)filtered=filtered.filter(l=>l.loc.toLowerCase().includes(filterLocation));
  if(typeof filterMin!=='undefined'&&filterMin)filtered=filtered.filter(l=>Number(l.price)>=filterMin);
  if(typeof filterMax!=='undefined'&&filterMax)filtered=filtered.filter(l=>Number(l.price)<=filterMax);
  if(typeof filterVerified!=='undefined'&&filterVerified)filtered=filtered.filter(l=>l.sellerVerified);
  if(sortMode==="price-asc")filtered.sort((a,b)=>Number(a.price)-Number(b.price));
  else if(sortMode==="price-desc")filtered.sort((a,b)=>Number(b.price)-Number(a.price));
  else filtered.sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
  renderPriceStats();
  document.getElementById('listCount').textContent=activeCat==="Барлығы"?`Барлық хабарландырулар (${filtered.length})`:`${activeCat} — ${filtered.length} хабарландыру`;
  const list=document.getElementById('listingsList');
  if(!filtered.length){list.innerHTML='<div class="empty-note">Ештеңе табылмады. Іздеуді немесе санатты өзгертіп көріңіз.</div>';return;}
  list.innerHTML=filtered.map(l=>{
    const isOwn=user&&user.phone===l.phone,canManage=isOwn||user?.role==='admin',isSold=l.status==='sold';
    const visual=l.images?.[0]?`<button class="listing-image-button" onclick="openGallery('${l.id}')" aria-label="Суреттерді ашу"><img class="listing-thumb" src="${escapeHTML(l.images[0])}" alt="${escapeHTML(l.title)}"></button>`:animalPhoto(l.type,l.title);
    const trust=`<div class="trust-badges">${l.sellerVerified?'<span class="trust-badge verified">✓ Тексерілген сатушы</span>':''}${l.sellerAuthId?'<span class="trust-badge">G Аккаунтпен кірген</span>':''}${l.sellerRating?`<span class="trust-badge">⭐ ${l.sellerRating} (${l.sellerReviewCount})</span>`:'<span class="trust-badge muted">Пікір әлі жоқ</span>'}</div>`;
    return `<div class="row-card ${isSold?'is-sold':''}">
      <div class="row-icon" style="background:${catColors[l.type]}18;">${visual}</div>
      <div class="row-body">
        <div class="row-title"><a class="listing-title-link" href="listing.html?id=${encodeURIComponent(l.id)}">${escapeHTML(l.title)}</a>${isNewItem(l.createdAt)?'<span class="badge-new">Жаңа</span>':''}${isSold?'<span class="badge-sold">Сатылды</span>':''}</div>
        <div class="row-meta"><span>📍 ${escapeHTML(l.loc)}</span><button class="seller-link" onclick="openSeller('${l.sellerAuthId||''}')">${l.avatar?`<img src="${escapeHTML(l.avatar)}" alt="">`:'👤'} ${escapeHTML(l.sellerShopName||l.seller)}</button>${l.images?.length?`<span>📷 ${l.images.length}</span>`:''}</div>${trust}<div class="animal-facts">${Object.entries(l.animalDetails||{}).filter(([,v])=>v).map(([k,v])=>`<span>${{breed:'Тұқым',age:'Жасы',weight:'Салмағы',health:'Денсаулық',documents:'Құжат'}[k]||k}: ${escapeHTML(v)}</span>`).join('')}</div>
      </div>
      <div class="row-actions">
        <div class="owner-actions">
          <a class="icon-btn" href="listing.html?id=${encodeURIComponent(l.id)}" title="Толық көру" aria-label="Толық көру">↗</a>
          <button class="icon-btn" onclick="shareListing('${l.id}')" title="WhatsApp-та бөлісу" aria-label="Бөлісу">↗︎</button>
          <button class="icon-btn ${isFavorite(l.id)?'fav-active':''}" onclick="toggleFavorite('${l.id}')" title="Таңдаулыға қосу">${isFavorite(l.id)?'★':'☆'}</button>
          ${!isOwn?`<button class="icon-btn" onclick="reportListing('${l.id}')" title="Шағымдану" aria-label="Шағымдану">⚑</button>`:''}
          ${canManage?`<button class="icon-btn" onclick="editListing('${l.id}')" title="Өңдеу">✏️</button><button class="icon-btn icon-btn-wide" onclick="toggleListingStatus('${l.id}','${isSold?'active':'sold'}')">${isSold?'Қайта ашу':'Сатылды'}</button><button class="icon-btn" onclick="deleteListing('${l.id}')" title="Өшіру">🗑</button>`:''}
        </div>
        <div class="row-price">${Number(l.price).toLocaleString('ru-RU')} ₸</div>
        ${isSold?`${user&&!isOwn?`<button class="btn btn-ghost btn-small" onclick="leaveReview('${l.id}')">⭐ Пікір</button>`:'<span class="modal-note">Сатылым жабық</span>'}`:`<div class="buyer-actions"><button class="btn btn-sky btn-small" onclick="openCallById('${l.id}')">📞 Қоңырау</button><a class="btn btn-ghost btn-small" href="https://wa.me/${String(l.phone||'').replace(/\D/g,'')}?text=${encodeURIComponent(`Сәлеметсіз бе! Мал Базары сайтындағы «${l.title}» хабарландыруы бойынша жазып тұрмын. ${listingUrl(l.id)}`)}" target="_blank" rel="noopener noreferrer">WhatsApp-қа жазу</a>${user&&!isOwn?`<button class="btn btn-ghost btn-small" onclick="startChat('${l.id}')">💬 Хат</button><button class="btn btn-ghost btn-small" onclick="makeOffer('${l.id}',${Number(l.price)})">💰 Ұсыныс</button><button class="btn btn-ghost btn-small" onclick="reserveListing('${l.id}')">🔒 Бронь</button>`:''}</div>`}
      </div>
    </div>`;
  }).join('');
}
let activeCallListingId=null;
function openCallById(id){activeCallListingId=id;const l=listings.find(x=>String(x.id)===String(id));if(!l)return;document.getElementById('callNumber').textContent=l.phone;document.getElementById('callSeller').textContent='Сатушы: '+l.seller+' — '+l.title;document.getElementById('callLink').href='tel:'+l.phone.replace(/\s/g,'');openModal('callModal');}
function openGallery(id){
  const l=listings.find(x=>String(x.id)===String(id));if(!l?.images?.length)return;
  document.getElementById('galleryTitle').textContent=l.title;
  document.getElementById('galleryMain').src=l.images[0];document.getElementById('galleryMain').alt=l.title;
  document.getElementById('galleryThumbs').innerHTML=l.images.map((url,i)=>`<button class="gallery-thumb ${i===0?'active':''}" onclick="setGalleryImage('${escapeHTML(url)}',this)"><img src="${escapeHTML(url)}" alt="${i+1}-сурет"></button>`).join('');
  openModal('galleryModal');
}
function setGalleryImage(url,button){document.getElementById('galleryMain').src=url;document.querySelectorAll('.gallery-thumb').forEach(x=>x.classList.remove('active'));button.classList.add('active');}

function renderListingImagePreview(){
  const grid=document.getElementById('listingImagePreview');
  const existing=existingListingImages.map(url=>`<div class="image-preview"><img src="${escapeHTML(url)}" alt=""></div>`);
  const fresh=selectedListingFiles.map(file=>`<div class="image-preview"><img src="${escapeHTML(URL.createObjectURL(file))}" alt=""></div>`);
  grid.innerHTML=[...existing,...fresh].join('');
  document.getElementById('clearImagesBtn').style.display=(existing.length||fresh.length)?'inline-flex':'none';
}
function handleListingImages(event){
  const files=[...(event.target.files||[])].filter(f=>['image/jpeg','image/png','image/webp'].includes(f.type));
  const room=8-existingListingImages.length;
  selectedListingFiles=files.slice(0,Math.max(0,room));
  if(files.length>room)showToast('Ең көбі 8 сурет');
  renderListingImagePreview();
}
function clearListingImages(){selectedListingFiles=[];existingListingImages=[];selectedProductFiles=[];document.getElementById('listingImageInput').value='';document.getElementById('productImageInput').value='';renderProductImagePreview();renderListingImagePreview();}
async function imageToBase64(file){
  const dataUrl=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);});
  const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=dataUrl;});
  const max=1400,scale=Math.min(1,max/Math.max(img.width,img.height)),canvas=document.createElement('canvas');
  canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,canvas.width,canvas.height);
  const label='МАЛ БАЗАРЫ  •  mal-bazary.vercel.app',short='МАЛ БАЗАРЫ',unit=Math.max(16,Math.round(canvas.width*.022));
  ctx.save();ctx.translate(canvas.width/2,canvas.height/2);ctx.rotate(-Math.PI/7);ctx.globalAlpha=.13;ctx.fillStyle='#fff';ctx.font=`800 ${Math.max(28,unit*2.2)}px Arial`;ctx.textAlign='center';ctx.shadowColor='rgba(0,0,0,.45)';ctx.shadowBlur=6;ctx.fillText(short,0,0);ctx.restore();
  ctx.save();ctx.font=`700 ${unit}px Arial`;const pad=Math.round(unit*.7),tw=ctx.measureText(label).width,x=canvas.width-tw-pad*2-14,y=canvas.height-unit-pad*2-14;ctx.fillStyle='rgba(10,28,20,.72)';if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,tw+pad*2,unit+pad*2,Math.round(unit*.55));ctx.fill()}else ctx.fillRect(x,y,tw+pad*2,unit+pad*2);ctx.fillStyle='#fff';ctx.textBaseline='middle';ctx.fillText(label,x+pad,y+pad+unit/2);ctx.restore();
  const out=canvas.toDataURL('image/jpeg',.84);return {imageBase64:out.split(',')[1],mimeType:'image/jpeg'};
}
async function uploadPostImages(files){
  const urls=[];
  window.mbUploadProgress?.(0,files.length);
  try{
    for(const [index,file] of files.entries()){
      const payload=await imageToBase64(file);
      const r=await apiFetch('/api/upload-listing-image',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const data=await r.json();if(!r.ok||!data.ok)throw new Error(data.message||'Сурет жүктелмеді');urls.push(data.url);
      window.mbUploadProgress?.(index+1,files.length);
    }
  }finally{
    setTimeout(()=>window.mbUploadProgress?.(null),250);
  }
  return urls;
}
function renderProductImagePreview(){const grid=document.getElementById('productImagePreview');grid.innerHTML=selectedProductFiles.map(file=>`<div class="image-preview"><img src="${escapeHTML(URL.createObjectURL(file))}" alt=""></div>`).join('');document.getElementById('clearProductImagesBtn').style.display=selectedProductFiles.length?'inline-flex':'none';}
function handleProductImages(event){const files=[...(event.target.files||[])].filter(f=>['image/jpeg','image/png','image/webp'].includes(f.type));selectedProductFiles=files.slice(0,8);if(files.length>8)showToast('Ең көбі 8 сурет');renderProductImagePreview();}
function clearProductImages(){selectedProductFiles=[];document.getElementById('productImageInput').value='';renderProductImagePreview();}
function editListing(id){
  const l=listings.find(x=>String(x.id)===String(id));if(!l)return;
  editingListingId=l.id;selectedListingFiles=[];existingListingImages=[...(l.images||[])];setPostKind('animal');openModal('postModal');
  document.getElementById('postKindSeg').style.display='none';document.getElementById('postType').value=l.type;document.getElementById('postTitle').value=l.title;document.getElementById('postDesc').value=l.desc;document.getElementById('postPrice').value=l.price;document.getElementById('postLoc').value=l.loc;document.getElementById('postBreed').value=l.animalDetails?.breed||'';document.getElementById('postAge').value=l.animalDetails?.age||'';document.getElementById('postWeight').value=l.animalDetails?.weight||'';document.getElementById('postHealth').value=l.animalDetails?.health||'';document.getElementById('postDocuments').value=l.animalDetails?.documents||'';document.getElementById('postSubmitBtn').textContent='Өзгерісті сақтау';renderListingImagePreview();
}
async function toggleListingStatus(id,status){
  try{const r=await apiFetch('/api/update-post',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,status})});const data=await r.json();if(!r.ok||!data.ok){showToast(data.message||'Статус өзгермеді');return;}await loadListings();showToast(status==='sold'?'Сатылды деп белгіленді':'Хабарландыру қайта ашылды');}catch{showToast('Байланыс қатесі');}
}

function productCard(p){
  const isOwn=user&&user.phone===p.phone,canManage=isOwn||user?.role==='admin';
  return `<div class="prod-card">
    ${p.images?.[0]?`<button class="prod-image-button" onclick="openProductGallery('${p.id}')"><img src="${escapeHTML(p.images[0])}" alt="${escapeHTML(p.name)}"></button>`:`<div class="prod-image-button product-placeholder"><img src="assets/home/${productPhotos[p.tag]||'equipment'}.svg" alt="${escapeHTML(p.name)}"></div>`}
    <span class="prod-tag ${p.tag}">${escapeHTML(tagLabels[p.tag] || 'ӨНІМ')}</span>${isNewItem(p.createdAt) ? '<span class="badge-new">Жаңа</span>' : ''}
    <div class="prod-name">${escapeHTML(p.name)}</div>
    <div class="prod-desc">${escapeHTML(p.desc)}</div>
    <div class="prod-price">${escapeHTML(p.price)}</div>
    <div class="prod-meta">📍 ${escapeHTML(p.loc)} · ${p.avatar ? `<img src="${escapeHTML(p.avatar)}" alt="" style="width:14px;height:14px;border-radius:50%;object-fit:cover;vertical-align:-2px;margin-right:2px;">` : "👤 "}${escapeHTML(p.seller)}</div>
    <div class="product-actions">
      <button class="btn btn-sky btn-small" onclick="openProductCall('${p.id}')">📞 Қоңырау шалу</button>
      ${canManage ? `<button class="icon-btn icon-btn-wide" onclick="deleteProduct('${p.id}')" title="Өшіру">🗑 Өшіру</button>` : ''}
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
function openProductGallery(id){const p=userProducts.find(x=>String(x.id)===String(id));if(!p?.images?.length)return;document.getElementById('galleryTitle').textContent=p.name;document.getElementById('galleryMain').src=p.images[0];document.getElementById('galleryMain').alt=p.name;document.getElementById('galleryThumbs').innerHTML=p.images.map((url,i)=>`<button class="gallery-thumb ${i===0?'active':''}" onclick="setGalleryImage('${escapeHTML(url)}',this)"><img src="${escapeHTML(url)}" alt="${i+1}-сурет"></button>`).join('');openModal('galleryModal');}
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
  if(id==='postModal' && !editingListingId){
    ['postTitle','postDesc','postPrice','postLoc','postBreed','postAge','postWeight','postHealth','postDocuments','prodTitle','prodDesc','prodPrice','prodLoc'].forEach(i=>{const el=document.getElementById(i);if(el)el.value='';});
    selectedListingFiles=[];existingListingImages=[];selectedProductFiles=[];document.getElementById('listingImageInput').value='';document.getElementById('productImageInput').value='';renderProductImagePreview();document.getElementById('postKindSeg').style.display='flex';document.getElementById('postSubmitBtn').textContent='Жариялау';renderListingImagePreview();setPostKind('animal');
  }
  if(id==='registerModal'){
    if(authSession()) getAuthIdentity().then(identity=>identity&&showProfileSetup(identity)); else showAuthStep();
  }
  lastFocusedElement = document.activeElement;
  const modal = document.getElementById(id);
  modal.classList.add('show');
  requestAnimationFrame(()=>modal.querySelector('button, a, input, select, textarea')?.focus());
}
function closeModal(id){
  document.getElementById(id).classList.remove('show');
  if(id==='postModal'){editingListingId=null;selectedListingFiles=[];existingListingImages=[];document.getElementById('postKindSeg').style.display='flex';document.getElementById('postSubmitBtn').textContent='Жариялау';}
  lastFocusedElement?.focus?.();
}
document.addEventListener('keydown', e=>{
  if(e.key === 'Escape') document.querySelectorAll('.overlay.show').forEach(m=>closeModal(m.id));
});
document.querySelectorAll('.overlay').forEach(m=>m.addEventListener('click', e=>{ if(e.target===m) closeModal(m.id); }));


/* ---------- SUPABASE AUTH: Google OAuth ---------- */
async function apiFetch(url, options = {}){
  const headers = { ...(options.headers || {}) };
  const token = await authAccessToken();
  if(token) headers.Authorization = `Bearer ${token}`;
  return fetch(url, { ...options, headers });
}

function showAuthStep(){
  document.getElementById('authStep').classList.remove('step-hidden');
  document.getElementById('profileSetupStep').classList.add('step-hidden');
}
function showProfileSetup(identity){
  document.getElementById('authStep').classList.add('step-hidden');
  document.getElementById('profileSetupStep').classList.remove('step-hidden');
  const suggested=identity?.user_metadata?.full_name||identity?.user_metadata?.name||'';
  if(suggested&&!document.getElementById('regName').value)document.getElementById('regName').value=suggested;
}
async function handleAuthenticatedUser(){
  const identity=await getAuthIdentity(); if(!identity)return;
  const r=await apiFetch('/api/user'), data=await r.json();
  if(data.ok&&data.exists){
    user={name:data.name,phone:data.phone,email:data.email,role:data.role||'user',avatarUrl:data.avatar_url||null,shopName:data.shop_name||'',bio:data.bio||'',verified:Boolean(data.verified)};
    updateHeader(); closeModal('registerModal'); renderListings(); renderProducts(); syncFavorites(); window.mbStartAlerts?.(); showToast('Қош келдіңіз, '+data.name+'!');
  }else showProfileSetup(identity);
}
async function finishProfileSetup(){
  const name=document.getElementById('regName').value.trim(), phone=document.getElementById('regPhone').value.trim();
  if(name.length<2){showToast('Аты-жөніңізді енгізіңіз');return;}
  if(phone.replace(/\D/g,'').length<11){showToast('Телефон нөмірін толық енгізіңіз');return;}
  try{
    const r=await apiFetch('/api/user',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,phone})});
    const data=await r.json(); if(!r.ok||!data.ok){showToast(data.message||'Профиль сақталмады');return;}
    user={name:data.name,phone:data.phone,email:data.email,role:data.role||'user',avatarUrl:data.avatar_url||null,shopName:data.shop_name||'',bio:data.bio||'',verified:Boolean(data.verified)};
    updateHeader();closeModal('registerModal');renderListings();renderProducts();syncFavorites();window.mbStartAlerts?.();showToast('Профиль дайын!');
  }catch{showToast('Байланыс қатесі');}
}
async function initializeAuth(){
  consumeOAuthHash();
  if(await getAuthIdentity()) await handleAuthenticatedUser();
}

async function logout(){
  window.mbStopAlerts?.(); await signOutAuth(); user=null; closeModal('profileModal');
  document.getElementById('headActions').innerHTML=`<button class="btn btn-ghost btn-small help-btn" onclick="openSupport()">❓ <span class="help-label">Көмек</span></button><button class="btn btn-ghost btn-small" onclick="openModal('registerModal')">Кіру</button><button class="btn btn-primary" onclick="openModal('postModal')">+ <span class="full-label">Хабарландыру беру</span></button>`;
  showToast('Шықтыңыз');renderListings();renderProducts();
}
async function switchAccount(){ await logout(); openModal('registerModal'); }
function avatarHTML(avatarUrl, initials){ return avatarUrl ? `<img src="${escapeHTML(avatarUrl)}" alt="">` : escapeHTML(initials); }
function updateHeader(){
  const el=document.getElementById('headActions'); if(!user)return;
  const initials=user.name.split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase();
  el.innerHTML=`<button class="btn btn-ghost btn-small help-btn" onclick="openSupport()" aria-label="Көмек" title="Көмек">❓ <span class="help-label">Көмек</span></button><button class="btn btn-ghost btn-small inbox-btn" onclick="openInbox()" aria-label="Хабарламалар" title="Хабарламалар"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5h16v11H9l-5 3v-14Z"/><path d="M8 10h.01M12 10h.01M16 10h.01"/></svg><span class="inbox-label">Хабарламалар</span><span class="inbox-count" id="inboxCount" hidden>0</span></button><div class="user-chip" style="cursor:pointer;" onclick="openProfileModal()" title="Профиль"><div class="avatar">${avatarHTML(user.avatarUrl,initials)}</div><span class="user-chip-name">${escapeHTML(user.name.split(' ')[0])}</span>${user.role==='admin'?'<span class="header-admin-badge">Admin</span>':''}</div>${user.role==='admin'?'<a class="btn btn-ghost btn-small admin-header-link" href="admin.html">Басқару</a>':''}<button class="btn btn-primary post-header-btn" onclick="openModal('postModal')"><span aria-hidden="true">+</span> <span class="full-label">Хабарландыру беру</span><span class="short-label">Жариялау</span></button>`;
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
  document.getElementById('profilePhone').textContent = `${user.phone}${user.email ? ' · '+user.email : ''}`;
  document.getElementById('adminPanel').style.display=user.role==='admin'?'block':'none';
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
  const submitBtn = document.getElementById('postSubmitBtn');
  if(submitBtn){ submitBtn.disabled = true; submitBtn.textContent = 'Жариялануда...'; }

  try{
    if(postKind === 'animal'){
      const type = document.getElementById('postType').value;
      const title = document.getElementById('postTitle').value.trim();
      const desc = document.getElementById('postDesc').value.trim();
      const price = parseInt(document.getElementById('postPrice').value);
      const loc = document.getElementById('postLoc').value.trim();
      if(!title || !price || !loc){ showToast('Барлық өрісті толтырыңыз'); return; }

      const uploaded=await uploadPostImages(selectedListingFiles);
      const images=[...existingListingImages,...uploaded];
      const isEdit=Boolean(editingListingId);
      const res=await apiFetch(isEdit?'/api/update-post':'/api/create-post',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({kind:'listing',id:editingListingId,type,title,description:desc,price,location:loc,region:document.getElementById('postRegion').value,district:document.getElementById('postDistrict').value,village:document.getElementById('postVillage').value.trim(),images,animal_details:{breed:document.getElementById('postBreed').value.trim(),age:document.getElementById('postAge').value.trim(),weight:document.getElementById('postWeight').value.trim(),health:document.getElementById('postHealth').value.trim(),documents:document.getElementById('postDocuments').value.trim()}})
      });
      const data=await res.json();
      if(!res.ok||!data.ok){showToast(data.message||'Қате шықты');return;}
      activeCat="Барлығы";renderCatbar();switchTab('animals');await loadListings();
      showToast(isEdit?'Хабарландыру жаңартылды!':'Хабарландыру жарияланды!');
    } else {
      const tag = document.getElementById('prodCat').value;
      const name = document.getElementById('prodTitle').value.trim();
      const desc = document.getElementById('prodDesc').value.trim();
      const price = document.getElementById('prodPrice').value.trim();
      const loc = document.getElementById('prodLoc').value.trim();
      if(!name || !price || !loc){ showToast('Барлық өрісті толтырыңыз'); return; }

      const images=await uploadPostImages(selectedProductFiles);
      const res = await apiFetch('/api/create-post', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ kind:'product', category: tag, name, description: desc, price, location: loc, region:document.getElementById('prodRegion').value,district:document.getElementById('prodDistrict').value,village:document.getElementById('prodVillage').value.trim(), images })
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

/* ---------- SUPPORT CENTER ---------- */
const TICKET_STATUS_LABELS={new:'Жаңа',in_progress:'Қаралуда',answered:'Жауап берілді',closed:'Жабылды'};
async function openSupport(){
  openModal('supportModal');
  document.getElementById('supportGuestNote').style.display=user?'none':'flex';
  document.getElementById('supportForm').style.display=user?'block':'none';
  document.querySelector('.support-tickets-section').style.display=user?'block':'none';
  if(user)await loadSupportTickets();
}
async function loadSupportTickets(){
  const box=document.getElementById('supportTickets');box.innerHTML='<div class="empty-note">Жүктелуде...</div>';
  try{
    const r=await apiFetch('/api/support'),data=await r.json();
    if(!r.ok||!data.ok){box.innerHTML=`<div class="empty-note">${escapeHTML(data.message||'Жүктелмеді')}</div>`;return;}
    document.getElementById('ticketsHeading').textContent=data.isAdmin?'Барлық қолдау өтінімдері':'Менің өтінімдерім';
    renderSupportTickets(data.tickets||[],data.isAdmin);
  }catch{box.innerHTML='<div class="empty-note">Байланыс қатесі</div>';}
}
function renderSupportTickets(tickets,isAdmin){
  const box=document.getElementById('supportTickets');
  if(!tickets.length){box.innerHTML='<div class="empty-note">Әзірше өтінім жоқ.</div>';return;}
  box.innerHTML=tickets.map(t=>`<div class="ticket-card">
    <div class="ticket-head"><div><div class="ticket-title">${escapeHTML(t.subject)}</div><div class="ticket-meta">${escapeHTML(t.category)} · ${new Date(t.created_at).toLocaleString('kk-KZ')}${isAdmin?` · ${escapeHTML(t.user_name||'')} · ${escapeHTML(t.user_email||'')}`:''}</div></div><span class="ticket-status ${escapeHTML(t.status)}">${escapeHTML(TICKET_STATUS_LABELS[t.status]||t.status)}</span></div>
    <div class="ticket-message">${escapeHTML(t.message)}</div>
    ${t.admin_reply?`<div class="ticket-reply"><b>Қолдау жауабы:</b><br>${escapeHTML(t.admin_reply)}</div>`:''}
    ${isAdmin?`<div class="ticket-admin-actions"><select id="ticketStatus-${t.id}"><option value="new" ${t.status==='new'?'selected':''}>Жаңа</option><option value="in_progress" ${t.status==='in_progress'?'selected':''}>Қаралуда</option><option value="answered" ${t.status==='answered'?'selected':''}>Жауап берілді</option><option value="closed" ${t.status==='closed'?'selected':''}>Жабылды</option></select><input id="ticketReply-${t.id}" maxlength="2000" value="${escapeHTML(t.admin_reply||'')}" placeholder="Жауап жазыңыз"><button class="btn btn-primary btn-small" onclick="answerSupportTicket('${t.id}')">Сақтау</button></div>`:''}
  </div>`).join('');
}
async function submitSupportTicket(){
  const category=document.getElementById('supportCategory').value,subject=document.getElementById('supportSubject').value.trim(),message=document.getElementById('supportMessage').value.trim();
  if(subject.length<5||message.length<10){showToast('Тақырып пен мәселені толығырақ жазыңыз');return;}
  const btn=document.getElementById('supportSubmitBtn');btn.disabled=true;btn.textContent='Жіберілуде...';
  try{const r=await apiFetch('/api/support',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({category,subject,message})});const data=await r.json();if(!r.ok||!data.ok){showToast(data.message||'Жіберілмеді');return;}document.getElementById('supportSubject').value='';document.getElementById('supportMessage').value='';showToast('Өтінім жіберілді');await loadSupportTickets();}catch{showToast('Байланыс қатесі');}finally{btn.disabled=false;btn.textContent='Өтінімді жіберу';}
}
async function answerSupportTicket(id){
  const status=document.getElementById(`ticketStatus-${id}`).value,admin_reply=document.getElementById(`ticketReply-${id}`).value.trim();
  try{const r=await apiFetch('/api/support',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,status,admin_reply})});const data=await r.json();if(!r.ok||!data.ok){showToast(data.message||'Сақталмады');return;}showToast('Өтінім жаңартылды');await loadSupportTickets();}catch{showToast('Байланыс қатесі');}
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
attachPhoneMask(document.getElementById('regPhone'));
resetPhoneField('regPhone');
renderCatbar();
loadListings();
loadUserProducts();
renderProducts();
initializeAuth();
