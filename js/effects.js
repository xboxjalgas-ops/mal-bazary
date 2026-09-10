/* Мал Базары — lightweight premium motion. No framework, reduced-motion safe. */
(()=>{
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce)return;
  document.documentElement.classList.add('fx-ready');

  const progress=document.createElement('div');
  progress.className='fx-progress';progress.setAttribute('aria-hidden','true');
  document.body.prepend(progress);
  const updateProgress=()=>{const max=document.documentElement.scrollHeight-innerHeight;progress.style.transform=`scaleX(${max>0?scrollY/max:0})`;};
  addEventListener('scroll',updateProgress,{passive:true});updateProgress();

  const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.add('fx-visible');revealObserver.unobserve(entry.target);}
  }),{threshold:.10,rootMargin:'0px 0px -28px'});

  const enhance=node=>{
    if(!(node instanceof Element))return;
    const targets=node.matches?.('.section-head,.cat-pill,.step,.feature-card,.cta-band,.row-card,.prod-card,.ticket-card')?[node]:[...node.querySelectorAll?.('.section-head,.cat-pill,.step,.feature-card,.cta-band,.row-card,.prod-card,.ticket-card')||[]];
    targets.forEach((el,i)=>{
      if(el.dataset.fxReady)return;el.dataset.fxReady='1';
      el.classList.add('fx-reveal','fx-card');el.style.setProperty('--fx-delay',`${Math.min(i%7,6)*45}ms`);revealObserver.observe(el);
      el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();el.style.setProperty('--mx',`${e.clientX-r.left}px`);el.style.setProperty('--my',`${e.clientY-r.top}px`);});
    });
  };
  enhance(document.body);
  new MutationObserver(m=>m.forEach(x=>x.addedNodes.forEach(enhance))).observe(document.body,{childList:true,subtree:true});

  document.querySelectorAll('.btn').forEach(btn=>btn.addEventListener('pointerdown',e=>{
    const r=btn.getBoundingClientRect(),dot=document.createElement('i');dot.className='fx-ripple';dot.style.left=`${e.clientX-r.left}px`;dot.style.top=`${e.clientY-r.top}px`;btn.append(dot);setTimeout(()=>dot.remove(),650);
  }));

  const hero=document.querySelector('.hero');
  if(hero&&matchMedia('(pointer:fine)').matches){hero.addEventListener('pointermove',e=>{const r=hero.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;hero.style.setProperty('--parallax-x',`${x*8}px`);hero.style.setProperty('--parallax-y',`${y*6}px`);});hero.addEventListener('pointerleave',()=>{hero.style.setProperty('--parallax-x','0px');hero.style.setProperty('--parallax-y','0px');});}
})();
