/* Optional additions. Keep existing form submission, authentication and rendering. */
(()=>{
  'use strict';
  const root=document.documentElement;
  const read=(key,fallback)=>{try{return localStorage.getItem(key)??fallback;}catch{return fallback;}};
  const write=(key,value)=>{try{localStorage.setItem(key,value);return true;}catch{return false;}};
  const ru=()=>root.lang==='ru';
  const text=(kk,rus)=>ru()?rus:kk;
  const element=(tag,className,content)=>{const node=document.createElement(tag);if(className)node.className=className;if(content)node.textContent=content;return node;};
  const option=(value,label)=>{const node=element('option','',label);node.value=value;return node;};
  function init(){
    if(document.querySelector('.mb-comfort-bar'))return;
    const bar=element('div','mb-comfort-bar');bar.setAttribute('role','region');
    const heading=element('strong');const large=element('button');const calm=element('button');
    large.type=calm.type='button';
    const status=element('span','mb-comfort-status');status.setAttribute('role','status');
    bar.append(heading,large,calm,status);
    (document.querySelector('header')||document.body.firstElementChild).after(bar);
    root.dataset.mbEasy=read('mb_easy_mode','off');
    root.dataset.mbCalm=read('mb_calm_mode',matchMedia('(prefers-reduced-motion: reduce)').matches?'on':'off');
    let lastSave=null;
    const refresh=()=>{
      bar.setAttribute('aria-label',text('Оқуға ыңғайлы','Удобство чтения'));
      heading.textContent=text('Оқуға ыңғайлы','Удобство чтения');
      large.textContent=text('Аа · Үлкен мәтін','Аа · Крупный текст');
      calm.textContent=text('Тыныш режим','Спокойный режим');
      large.setAttribute('aria-pressed',String(root.dataset.mbEasy==='on'));
      calm.setAttribute('aria-pressed',String(root.dataset.mbCalm==='on'));
      document.querySelector('.mb-easy-toggle')?.setAttribute('aria-pressed',String(root.dataset.mbEasy==='on'));
      document.querySelector('.mb-easy-toggle')?.classList.toggle('is-on',root.dataset.mbEasy==='on');
      document.querySelectorAll('[data-mb-mode]').forEach(b=>b.classList.toggle('active',(b.dataset.mbMode==='easy')===(root.dataset.mbEasy==='on')));
      if(lastSave!==null)status.textContent=lastSave?text('Баптау сақталды','Настройка сохранена'):text('Баптау тек осы бетте сақталады','Настройка действует только на этой странице');
    };
    function toggle(property,key){
      const value=root.dataset[property]==='on'?'off':'on';root.dataset[property]=value;
      lastSave=write(key,value);refresh();
    }
    large.addEventListener('click',()=>toggle('mbEasy','mb_easy_mode'));
    calm.addEventListener('click',()=>toggle('mbCalm','mb_calm_mode'));
    refresh();
    const languageRefresh=[];
    new MutationObserver(()=>{refresh();languageRefresh.forEach(fn=>fn());}).observe(root,{attributes:true,attributeFilter:['lang','data-mb-easy']});
    document.addEventListener('click',event=>{
      if(root.dataset.mbCalm!=='on')return;
      const link=event.target.closest('a[href]');
      if(!link||event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||link.target||link.hasAttribute('download'))return;
      const url=new URL(link.href,location.href);
      if(url.origin!==location.origin)return;
      // Bypass only the decorative delayed navigation, retaining native link behavior.
      event.stopImmediatePropagation();
    },true);
    const catalog=window.MBCatalog;
    if(!catalog||!document.getElementById('postType'))return;
    const type=document.getElementById('postType'),breed=document.getElementById('postBreed');
    const breedPicker=element('select');breedPicker.id='mbPostBreedPicker';breed.before(breedPicker);
    const formBreedLabel=document.querySelector('label[for="postBreed"]');formBreedLabel.htmlFor=breedPicker.id;
    function updateBreeds(){
      const selected=breed.value,values=catalog.getBreeds(type.value);
      formBreedLabel.textContent=text('Мал тұқымын таңдаңыз','Выберите породу');
      breedPicker.replaceChildren(option('',text('Тұқымын таңдаңыз','Выберите породу')),...values.map(value=>option(value,value)),option('__custom__',text('Басқа тұқым / будан','Другая порода / помесь')));
      breedPicker.value=selected?(values.includes(selected)?selected:'__custom__'):'';
      breed.style.display=breedPicker.value==='__custom__'?'':'none';
      breed.setAttribute('aria-label',text('Өзге тұқым атауы','Название другой породы'));
      breed.placeholder=text('Тұқымын немесе будан екенін жазыңыз','Укажите породу или помесь');
    }
    window.syncBreedPicker=updateBreeds;
    breedPicker.addEventListener('change',()=>{
      const custom=breedPicker.value==='__custom__';breed.value=custom?'':breedPicker.value;
      breed.style.display=custom?'':'none';if(custom)breed.focus();
      breed.dispatchEvent(new Event('change',{bubbles:true}));
    });
    type.addEventListener('change',()=>{breed.value='';updateBreeds();});updateBreeds();languageRefresh.push(updateBreeds);
    const previousEdit=window.editListing;
    window.editListing=function(id){const result=previousEdit(id);updateBreeds();return result;};
    const breedSelect=element('select');breedSelect.id='mbBreedFilter';
    const breedBar=element('div','mb-catalog-filter');const breedLabel=element('label');breedLabel.htmlFor=breedSelect.id;
    breedBar.append(breedLabel,breedSelect);document.getElementById('advancedFilters').after(breedBar);
    function refreshBreedFilter(){
      const selected=breedSelect.value;
      const values=typeof activeCat==='string'&&activeCat!=='Барлығы'?catalog.getBreeds(activeCat):Object.values(catalog.breeds).flat();
      breedLabel.textContent=text('Мал тұқымы','Порода');
      breedSelect.replaceChildren(option('',text('Барлық тұқымдар','Все породы')),...values.map(value=>option(value,value)));
      breedSelect.value=values.includes(selected)?selected:'';
    }
    refreshBreedFilter();languageRefresh.push(refreshBreedFilter);
    // Filter a temporary view; restore the source array even when the old renderer throws.
    const previousRender=window.renderListings;
    window.renderListings=function(){
      refreshBreedFilter();const original=listings;
      try{listings=original.filter(item=>catalog.matchesBreed(item,breedSelect.value));return previousRender();}
      finally{listings=original;}
    };
    breedSelect.addEventListener('change',()=>window.renderListings());
    const previousReset=window.resetAdvancedFilters;
    window.resetAdvancedFilters=function(){breedSelect.value='';return previousReset();};
    const productView=document.getElementById('productsView');
    const searchBar=element('div','mb-catalog-filter');const searchLabel=element('label');const search=element('input');search.type='search';search.id='mbProductSearch';searchLabel.htmlFor=search.id;
    const note=element('p','mb-catalog-note');searchBar.append(searchLabel,search,note);productView.prepend(searchBar);
    const previousProducts=window.renderProducts;
    window.renderProducts=function(){const original=userProducts;try{userProducts=original.filter(item=>catalog.matchesProduct(item,search.value));return previousProducts();}finally{userProducts=original;}};
    search.addEventListener('input',()=>window.renderProducts());
    const field=element('div','field');const productLabel=element('label');const picker=element('select','mb-product-picker');picker.id='mbProductTemplate';productLabel.htmlFor=picker.id;
    field.append(productLabel,picker);document.getElementById('prodTitle').closest('.field').before(field);
    function refreshProducts(){
      const selected=picker.value;
      productLabel.textContent=text('Құрал түрі (міндетті емес)','Вид товара (необязательно)');
      picker.replaceChildren(option('',text('Таңдау немесе өз атауыңызды жазу','Выберите или укажите своё название')),...catalog.products.map(item=>option(item.id,text(item.kk,item.ru))));picker.value=selected;
      searchLabel.textContent=text('Өнімді іздеу','Поиск товаров');
      search.placeholder=text('Мысалы: кувалда, күрек, ер-тоқым','Например: кувалда, лопата, седло');
      note.textContent=text('Тек сатушылар жариялаған хабарландырулар көрсетіледі.','Здесь показаны только объявления, опубликованные продавцами.');
    }
    refreshProducts();languageRefresh.push(refreshProducts);
    picker.addEventListener('change',()=>{
      const selected=catalog.products.find(item=>item.id===picker.value);if(!selected)return;
      const title=document.getElementById('prodTitle');title.value=text(selected.kk,selected.ru);document.getElementById('prodCat').value=selected.category;
      title.classList.remove('mb-choice-feedback');void title.offsetWidth;title.classList.add('mb-choice-feedback');title.focus();
    });
    const previousOpen=window.openModal;
    window.openModal=function(id){const result=previousOpen(id);if(id==='postModal'){picker.value='';updateBreeds();}return result;};
    const headingProducts=document.querySelector('#coopGrid')?.previousElementSibling;
    if(headingProducts){const translateHeading=()=>{headingProducts.textContent=text('Шаруашылық құралдары мен жабдықтар','Инструменты и оборудование для хозяйства');};translateHeading();languageRefresh.push(translateHeading);}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
