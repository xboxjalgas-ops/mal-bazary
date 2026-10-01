/* Short visual story for the landing page. Static first frame remains visible without JS. */
(() => {
  const story = document.querySelector('[data-hero-story]');
  if (!story) return;

  const frames = [...story.querySelectorAll('.hero-story-frame')];
  const steps = [...story.querySelectorAll('.hero-story-steps i')];
  const count = story.querySelector('[data-story-index]');
  const next = story.querySelector('.hero-story-next');
  const toggle = story.querySelector('.hero-story-toggle');
  const status = story.querySelector('[data-story-status]');
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0;
  let playing = !motionPreference.matches;
  let visible = true;
  let timer;
  const calm = () => document.documentElement.dataset.mbCalm === 'on';

  function labels() {
    const russian = document.documentElement.lang === 'ru';
    story.setAttribute('aria-label', russian ? 'Короткий обзор рынка' : 'Нарықтың қысқа көрінісі');
    next.setAttribute('aria-label', russian ? 'Следующий кадр' : 'Келесі кадр');
  }

  function show() {
    frames.forEach((frame, i) => {
      const active = i === index;
      frame.classList.toggle('is-current', active);
      frame.setAttribute('aria-hidden', String(!active));
      steps[i].classList.toggle('is-current', active);
    });
    count.textContent = String(index + 1).padStart(2, '0');
    story.classList.toggle('is-paused', !playing || calm());
  }

  function schedule() {
    clearTimeout(timer);
    if (playing && !motionPreference.matches && !calm() && visible && !document.hidden) {
      timer = setTimeout(() => { index = (index + 1) % frames.length; show(); schedule(); }, 5500);
    }
  }

  next.addEventListener('click', () => {
    index = (index + 1) % frames.length;
    show();
    status.textContent = `${index + 1} / ${frames.length}: ${frames[index].querySelector('figcaption strong').textContent}`;
    schedule();
  });
  toggle.addEventListener('click', () => { playing = !playing; show(); schedule(); });
  document.addEventListener('visibilitychange', schedule);
  motionPreference.addEventListener('change', () => { if (motionPreference.matches) playing = false; show(); schedule(); });
  new MutationObserver(() => { labels(); show(); schedule(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang', 'data-mb-calm'] });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; schedule(); }, { threshold: .1 }).observe(story);
  }
  labels();
  show();
  schedule();
})();
