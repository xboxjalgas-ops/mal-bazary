/* Мал Базары — lightweight premium motion, Scrollcraft principles, reduced-motion safe. */
(()=>{
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce)return;
  document.documentElement.classList.add('fx-ready');

  const clamp=(n,min=0,max=1)=>Math.min(max,Math.max(min,n));
  const progress=document.createElement('div');
  progress.className='fx-progress';progress.setAttribute('aria-hidden','true');document.body.prepend(progress);

  const hero=document.querySelector('[data-scroll-hero]');
  const gate=document.querySelector('[data-market-gate]');
  const steps=[...document.querySelectorAll('[data-scroll-step]')];
  let ticking=false;
  const paintScroll=()=>{
    ticking=false;
    const max=document.documentElement.scrollHeight-innerHeight;
    progress.style.transform=`scaleX(${max>0?scrollY/max:0})`;
    if(hero){const r=hero.getBoundingClientRect(),p=clamp(-r.top/Math.max(r.height,1));hero.style.setProperty('--hero-p',p.toFixed(3));hero.style.setProperty('--hero-x',`${(p*18).toFixed(1)}px`);}
    if(gate){const r=gate.getBoundingClientRect(),travel=Math.max(r.height-innerHeight,1),raw=clamp(-r.top/travel),p=raw<.16?0:clamp((raw-.16)/.64);gate.style.setProperty('--gate',p.toFixed(3));gate.querySelector('.gate-stage')?.setAttribute('data-sc-verify-state',`gate-${Math.round(p*20)}`);}
    if(steps.length){const focus=innerHeight*.62;let nearest=null,dist=Infinity;steps.forEach(step=>{const d=Math.abs(step.getBoundingClientRect().top-focus);if(d<dist){dist=d;nearest=step;}});steps.forEach(step=>step.classList.toggle('scroll-step-active',step===nearest));}
  };
  const requestPaint=()=>{if(!ticking){ticking=true;requestAnimationFrame(paintScroll);}};
  addEventListener('scroll',requestPaint,{passive:true});addEventListener('resize',requestPaint,{passive:true});paintScroll();

  const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('fx-visible');revealObserver.unobserve(entry.target);}}),{threshold:.10,rootMargin:'0px 0px -28px'});
  const enhance=node=>{if(!(node instanceof Element))return;const targets=node.matches?.('.section-head,.cat-pill,.step,.feature-card,.cta-band,.row-card,.prod-card,.ticket-card')?[node]:[...node.querySelectorAll?.('.section-head,.cat-pill,.step,.feature-card,.cta-band,.row-card,.prod-card,.ticket-card')||[]];targets.forEach((el,i)=>{if(el.dataset.fxReady)return;el.dataset.fxReady='1';if(!el.closest('[data-market-gate]')&&!el.matches('[data-scroll-step]')){el.classList.add('fx-reveal');revealObserver.observe(el);}el.classList.add('fx-card');el.style.setProperty('--fx-delay',`${Math.min(i%7,6)*45}ms`);el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();el.style.setProperty('--mx',`${e.clientX-r.left}px`);el.style.setProperty('--my',`${e.clientY-r.top}px`);});});};
  enhance(document.body);new MutationObserver(m=>m.forEach(x=>x.addedNodes.forEach(enhance))).observe(document.body,{childList:true,subtree:true});

  document.querySelectorAll('.btn').forEach(btn=>btn.addEventListener('pointerdown',e=>{const r=btn.getBoundingClientRect(),dot=document.createElement('i');dot.className='fx-ripple';dot.style.left=`${e.clientX-r.left}px`;dot.style.top=`${e.clientY-r.top}px`;btn.append(dot);setTimeout(()=>dot.remove(),650);}));
  if(hero&&matchMedia('(pointer:fine)').matches){hero.addEventListener('pointermove',e=>{const r=hero.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;hero.style.setProperty('--parallax-x',`${x*8}px`);hero.style.setProperty('--parallax-y',`${y*6}px`);});hero.addEventListener('pointerleave',()=>{hero.style.setProperty('--parallax-x','0px');hero.style.setProperty('--parallax-y','0px');});}
})();
