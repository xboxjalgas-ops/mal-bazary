/* Мал Базары Experience Pack — motion, resilience and mobile UX. */
(()=>{
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $=(s,r=document)=>r.querySelector(s);
  document.documentElement.classList.add('mb-experience');

  const curtain=document.createElement('div');
  curtain.className='mb-page-curtain';curtain.setAttribute('aria-hidden','true');
  curtain.innerHTML='<span></span><span></span><b>МАЛ БАЗАРЫ</b>';
  document.body.append(curtain);
  requestAnimationFrame(()=>curtain.classList.add('is-ready'));

  document.addEventListener('click',event=>{
    const link=event.target.closest('a[href]');
    if(!link||reduced||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.target==='_blank'||link.hasAttribute('download'))return;
    const url=new URL(link.href,location.href);
    if(url.origin!==location.origin||url.pathname===location.pathname&&url.hash)return;
    event.preventDefault();curtain.classList.add('is-leaving');setTimeout(()=>location.href=url.href,230);
  });

  const net=document.createElement('div');
  net.className='mb-network-pill';net.setAttribute('role','status');net.setAttribute('aria-live','polite');document.body.append(net);
  let netTimer;
  const paintNetwork=()=>{
    clearTimeout(netTimer);const online=navigator.onLine;
    net.classList.toggle('offline',!online);net.classList.add('show');
    net.innerHTML=online?'<i></i> Қайта онлайн':'<i></i> Интернет жоқ · офлайн режим';
    netTimer=setTimeout(()=>{if(online)net.classList.remove('show')},2400);
  };
  addEventListener('online',paintNetwork);addEventListener('offline',paintNetwork);
  if(!navigator.onLine)paintNetwork();

  const top=document.createElement('button');
  top.type='button';top.className='mb-backtop';top.setAttribute('aria-label','Беттің басына қайту');top.innerHTML='↑';document.body.append(top);
  let tick=false;
  const onScroll=()=>{if(tick)return;tick=true;requestAnimationFrame(()=>{top.classList.toggle('show',scrollY>650);tick=false})};
  addEventListener('scroll',onScroll,{passive:true});top.addEventListener('click',()=>scrollTo({top:0,behavior:reduced?'auto':'smooth'}));onScroll();

  document.addEventListener('keydown',event=>{
    if(event.key!=='/'||event.ctrlKey||event.metaKey||event.altKey||/input|textarea|select/i.test(document.activeElement?.tagName||''))return;
    const search=$('#searchInput');if(!search)return;event.preventDefault();search.focus();search.select?.();
  });

  document.querySelectorAll('img').forEach((img,i)=>{
    img.decoding='async';if(i>2&&!img.closest('.hero,.logo,.detail-gallery'))img.loading='lazy';
    img.addEventListener('load',()=>img.classList.add('mb-image-ready'),{once:true});
  });

  window.mbSkeleton=(target,count=4)=>{
    const box=typeof target==='string'?document.getElementById(target):target;if(!box)return;
    box.setAttribute('aria-busy','true');
    box.innerHTML=Array.from({length:count},()=>'<div class="mb-skeleton-card" aria-hidden="true"><i></i><span><b></b><b></b><b></b></span></div>').join('');
  };
  window.mbLoaded=target=>{const box=typeof target==='string'?document.getElementById(target):target;box?.removeAttribute('aria-busy')};

  let upload=document.getElementById('mbUploadHud');
  window.mbUploadProgress=(current,total,label='Суреттер жүктелуде')=>{
    if(!upload){upload=document.createElement('div');upload.id='mbUploadHud';upload.className='mb-upload-hud';upload.setAttribute('role','status');upload.innerHTML='<div><strong></strong><span></span><i><b></b></i></div>';document.body.append(upload)}
    if(current===null){upload.classList.remove('show');return}
    const pct=Math.max(0,Math.min(100,Math.round(current/Math.max(total,1)*100)));
    $('strong',upload).textContent=label;$('span',upload).textContent=`${current}/${total}`;$('i b',upload).style.width=`${pct}%`;upload.classList.add('show');
  };

  addEventListener('load',()=>{
    if(!('serviceWorker'in navigator))return;
    navigator.serviceWorker.ready.then(reg=>{
      reg.addEventListener('updatefound',()=>{
        const worker=reg.installing;worker?.addEventListener('statechange',()=>{
          if(worker.state==='installed'&&navigator.serviceWorker.controller){
            net.innerHTML='<i></i> Жаңарту дайын · парақты жаңартыңыз';net.classList.add('show','update');
          }
        });
      });
    }).catch(()=>{});
  });
})();
