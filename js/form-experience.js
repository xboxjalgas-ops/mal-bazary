(()=>{
  function init(){
    const modal=document.getElementById('postModal'),rules=window.MBFormRules;if(!modal||!rules)return;
    const text=(kk,ru)=>document.documentElement.lang==='ru'?ru:kk;
    const value=id=>document.getElementById(id)?.value||'';
    const node=(tag,content)=>{const el=document.createElement(tag);if(content)el.textContent=content;return el;};
    const announce=message=>{document.getElementById('mbFormStatus').textContent=message;};
    const status=node('p');status.id='mbFormStatus';status.className='mb-catalog-note';status.setAttribute('role','status');
    document.getElementById('postSubmitBtn').before(status);
    Object.entries(rules.limits).forEach(([id,max])=>{document.getElementById(id).maxLength=max;});
    const price=document.getElementById('postPrice');price.min='0.01';price.max='1000000000';price.step='0.01';
    function clearErrors(){modal.querySelectorAll('[aria-invalid="true"]').forEach(el=>{el.removeAttribute('aria-invalid');if(el.getAttribute('aria-describedby')===el.id+'Error')el.removeAttribute('aria-describedby');});modal.querySelectorAll('.mb-field-error').forEach(el=>el.remove());}
    const originalSubmit=window.submitPost;
    let submitting=false;
    window.submitPost=async function(){
      if(submitting)return;
      clearErrors();const values={};for(const el of modal.querySelectorAll('input,select,textarea'))values[el.id]=el.value;
      const errors=rules.validate(postKind,values);
      if(errors.length){
        for(const error of errors){
          const el=document.getElementById(error.field);if(!el)continue;
          const message=error.code==='title'?text('Кемінде 3 таңба жазыңыз','Введите не менее 3 символов'):error.code==='price'?text('Баға 0-ден үлкен, 1 000 000 000-нан аспауы тиіс','Цена должна быть больше 0 и не превышать 1 000 000 000'):error.code==='location'?text('Орналасқан жерін таңдаңыз (2–120 таңба)','Укажите местоположение (2–120 символов)'):error.code==='length'?text(`Ең көбі ${error.limit} таңба`,`Не более ${error.limit} символов`):text('Бұл өрісті толтырыңыз','Заполните это поле');
          const note=node('span',message);note.className='mb-field-error';note.id=error.field+'Error';el.setAttribute('aria-invalid','true');el.setAttribute('aria-describedby',note.id);el.after(note);
        }
        document.getElementById(errors[0].field)?.focus();announce(text('Белгіленген өрістерді тексеріңіз','Проверьте отмеченные поля'));return;
      }
      submitting=true;try{return await originalSubmit();}finally{submitting=false;}
    };
    const draftButtons=node('div');draftButtons.className='mb-draft-actions';
    const save=node('button'),restore=node('button');save.type=restore.type='button';save.className=restore.className='btn btn-ghost btn-small';
    const updateLabels=()=>{
      save.textContent=text('Нобайды сақтау','Сохранить черновик');restore.textContent=text('Нобайды ашу','Восстановить черновик');
      for(const [id,kk,ru] of [['filterMinPrice','Ең төменгі баға','Минимальная цена'],['filterMaxPrice','Ең жоғарғы баға','Максимальная цена'],['filterLocation','Қала немесе аудан','Город или район'],['postRegion','Облыс','Область'],['postDistrict','Аудан','Район'],['postVillage','Елді мекен','Населённый пункт'],['prodRegion','Облыс','Область'],['prodDistrict','Аудан','Район'],['prodVillage','Елді мекен','Населённый пункт']])document.getElementById(id)?.setAttribute('aria-label',text(kk,ru));
    };updateLabels();
    new MutationObserver(updateLabels).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
    draftButtons.append(save,restore);status.before(draftButtons);
    const draftKey=()=>user&&(user.email||user.phone)?'mb_post_draft_v1:'+String(user.email||user.phone):null;
    save.addEventListener('click',()=>{
      const key=draftKey();if(!key||editingListingId){announce(text('Нобай тек жаңа хабарландыру үшін сақталады','Черновик сохраняется только для нового объявления'));return;}
      const fields=Object.fromEntries(rules.draftFields.map(id=>[id,value(id)]));
      try{localStorage.setItem(key,JSON.stringify(rules.cleanDraft({version:1,kind:postKind,fields})));announce(text('Нобай осы құрылғыда сақталды. Фотосуреттер мен құжат өрісі сақталмайды.','Черновик сохранён на этом устройстве. Фотографии и поле документов не сохраняются.'));}
      catch{announce(text('Браузер нобайды сақтай алмады. Өрістер ашық тұр.','Браузер не смог сохранить черновик. Введённые данные остаются в форме.'));}
    });
    restore.addEventListener('click',()=>{
      const key=draftKey();if(!key||editingListingId)return;
      let draft;try{draft=rules.cleanDraft(JSON.parse(localStorage.getItem(key)||'null'));}catch{}
      if(!draft){announce(text('Сақталған нобай жоқ','Сохранённый черновик не найден'));return;}
      if(['postTitle','postDesc','prodTitle','prodDesc'].some(id=>value(id).trim())&&!confirm(text('Ағымдағы мәтінді нобаймен ауыстыру керек пе?','Заменить введённый текст сохранённым черновиком?')))return;
      window.setPostKind(draft.kind);
      document.getElementById('postDocuments').value='';
      selectedListingFiles=[];existingListingImages=[];selectedProductFiles=[];window.renderListingImagePreview();window.renderProductImagePreview();
      for(const prefix of ['post','prod']){
        const region=document.getElementById(prefix+'Region');region.value=draft.fields[prefix+'Region']||'';region.dispatchEvent(new Event('change',{bubbles:true}));
      }
      for(const [id,val] of Object.entries(draft.fields))document.getElementById(id).value=val;
      for(const prefix of ['post','prod'])window.syncLocation(prefix+'Region',prefix+'District',prefix+'Village',prefix+'Loc');
      document.getElementById('postType').dispatchEvent(new Event('change',{bubbles:true}));document.getElementById('postBreed').value=draft.fields.postBreed||'';
      window.syncBreedPicker?.();
      clearErrors();announce(text('Нобай ашылды. Фотосуреттерді қайта таңдаңыз.','Черновик восстановлен. Фотографии выберите заново.'));
    });
    const urls={listing:[],product:[]};
    const release=kind=>{urls[kind].forEach(url=>URL.revokeObjectURL(url));urls[kind]=[];};
    function preview(kind){
      release(kind);const listing=kind==='listing',grid=document.getElementById(listing?'listingImagePreview':'productImagePreview');grid.replaceChildren();
      const files=listing?selectedListingFiles:selectedProductFiles;
      const sources=[...(listing?existingListingImages:[]),...files.map(file=>{const url=URL.createObjectURL(file);urls[kind].push(url);return url;})];
      sources.forEach((src,index)=>{const box=node('div');box.className='image-preview';const img=node('img');img.src=src;img.alt=text(`${index+1}-сурет`,`Фото ${index+1}`);box.append(img);grid.append(box);});
      document.getElementById(listing?'clearImagesBtn':'clearProductImagesBtn').style.display=sources.length?'inline-flex':'none';
    }
    window.renderListingImagePreview=()=>preview('listing');window.renderProductImagePreview=()=>preview('product');
    function selectImages(event,kind){
      const files=[...(event.target.files||[])],valid=files.filter(file=>!rules.imageProblem(file));
      const room=kind==='listing'?Math.max(0,8-existingListingImages.length):8;
      if(kind==='listing')selectedListingFiles=valid.slice(0,room);else selectedProductFiles=valid.slice(0,room);
      preview(kind);
      if(valid.length!==files.length||valid.length>room)announce(text('JPEG, PNG, WEBP: әр файл 4 МБ-қа дейін, барлығы 8 суретке дейін. Артық немесе жарамсыз файлдар алынбады.','JPEG, PNG, WEBP: до 4 МБ на файл и до 8 фотографий. Лишние или неподходящие файлы не добавлены.'));
      event.target.value='';
    }
    window.handleListingImages=event=>selectImages(event,'listing');window.handleProductImages=event=>selectImages(event,'product');
    // Clearing animal photos must not discard the separate product selection.
    window.clearListingImages=()=>{selectedListingFiles=[];existingListingImages=[];document.getElementById('listingImageInput').value='';preview('listing');};
    const originalClose=window.closeModal;
    window.closeModal=function(id){if(id==='postModal'){release('listing');release('product');clearErrors();status.textContent='';}return originalClose(id);};
    addEventListener('pagehide',()=>{release('listing');release('product');});
    const min=document.getElementById('filterMinPrice'),max=document.getElementById('filterMaxPrice');
    const rangeStatus=node('p');rangeStatus.className='mb-field-error';rangeStatus.id='mbPriceRangeError';rangeStatus.setAttribute('role','status');document.getElementById('advancedFilters').append(rangeStatus);
    const originalFilters=window.applyAdvancedFilters;
    window.applyAdvancedFilters=function(){
      const valid=rules.priceRange(min.value,max.value);min.setAttribute('aria-invalid',String(!valid));max.setAttribute('aria-invalid',String(!valid));
      rangeStatus.textContent=valid?'':text('Баға теріс болмауы тиіс; ең төменгі баға ең жоғарғы бағадан аспасын.','Цена не может быть отрицательной; минимум не должен превышать максимум.');
      if(valid)return originalFilters();
    };
    min.setAttribute('aria-describedby',rangeStatus.id);max.setAttribute('aria-describedby',rangeStatus.id);
    const originalReset=window.resetAdvancedFilters;window.resetAdvancedFilters=function(){const result=originalReset();rangeStatus.textContent='';min.removeAttribute('aria-invalid');max.removeAttribute('aria-invalid');return result;};
    document.addEventListener('keydown',event=>{
      if(event.key!=='Tab')return;
      const current=[...document.querySelectorAll('.overlay.show')].at(-1);if(!current)return;
      const controls=[...current.querySelectorAll('button,a[href],input,select,textarea,[tabindex="0"]')].filter(el=>!el.disabled&&el.getClientRects().length);
      const first=controls[0],last=controls.at(-1);if(!first)return;
      if(event.shiftKey&&(document.activeElement===first||!current.contains(document.activeElement))){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&(document.activeElement===last||!current.contains(document.activeElement))){event.preventDefault();first.focus();}
    });
    document.querySelectorAll('.overlay[role="dialog"]').forEach(dialog=>{const heading=dialog.querySelector('h2');if(heading){heading.id ||= dialog.id+'Heading';dialog.setAttribute('aria-labelledby',heading.id);}});
    document.querySelectorAll('label.upload-box').forEach(label=>{label.tabIndex=0;label.setAttribute('role','button');label.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();document.getElementById(label.htmlFor)?.click();}});});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
