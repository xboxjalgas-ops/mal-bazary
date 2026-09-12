/* Мал Базары — privacy-friendly in-app/browser alerts. */
(() => {
  const ENABLED_KEY = 'mb_alerts_enabled';
  let timer = null;
  let previousUnread = null;

  function enabled() {
    return localStorage.getItem(ENABLED_KEY) === '1';
  }

  function updateButton() {
    const button = document.getElementById('notificationToggle');
    if (!button) return;
    const active = enabled() && 'Notification' in window && Notification.permission === 'granted';
    button.textContent = active ? '🔔 Хабарламалар қосулы' : '🔕 Хабарламаларды қосу';
    button.setAttribute('aria-pressed', String(active));
  }

  function unreadCount(data) {
    const me = data.me_id;
    const messages = (data.messages || []).filter(item => !item.read_at && item.sender_id !== me).length;
    const offers = (data.offers || []).filter(item => item.seller_id === me && item.status === 'pending').length;
    const reservations = (data.reservations || []).filter(item => item.seller_id === me && item.status === 'pending').length;
    return messages + offers + reservations;
  }

  function setBadge(count) {
    const badge = document.getElementById('inboxCount');
    if (!badge) return;
    badge.textContent = String(Math.min(99, count));
    badge.hidden = count < 1;
    badge.setAttribute('aria-label', `${count} жаңа хабарлама`);
  }

  async function showAlert(count) {
    if (!enabled() || Notification.permission !== 'granted' || count < 1) return;
    const payload = {
      title: 'Мал Базары',
      body: `${count} жаңа сауда хабарламасы бар`,
      tag: 'mal-bazary-inbox',
      url: '/market.html?inbox=1',
    };
    const registration = await navigator.serviceWorker?.ready.catch(() => null);
    if (registration?.active) registration.active.postMessage({ type: 'SHOW_NOTIFICATION', payload });
    else new Notification(payload.title, { body: payload.body, tag: payload.tag });
  }

  async function poll() {
    if (!window.user || document.visibilityState === 'hidden') return;
    try {
      const response = await apiFetch('/api/community?mode=inbox');
      const data = await response.json();
      if (!response.ok || !data.ok) return;
      const unread = unreadCount(data);
      setBadge(unread);
      if (previousUnread !== null && unread > previousUnread) await showAlert(unread - previousUnread);
      previousUnread = unread;
    } catch {
      // Offline mode keeps the previous badge without noisy errors.
    }
  }

  async function enableAlerts() {
    if (!('Notification' in window)) {
      showToast('Бұл браузер хабарламаларды қолдамайды');
      return;
    }
    if (enabled()) {
      localStorage.removeItem(ENABLED_KEY);
      updateButton();
      showToast('Браузер хабарламалары өшірілді');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      showToast('Браузер хабарламаға рұқсат бермеді');
      return;
    }
    localStorage.setItem(ENABLED_KEY, '1');
    updateButton();
    showToast('Жаңа чат пен ұсыныстар туралы хабарлаймыз');
    await poll();
  }

  function start() {
    clearInterval(timer);
    previousUnread = null;
    updateButton();
    poll();
    timer = setInterval(poll, 30_000);
  }

  function stop() {
    clearInterval(timer);
    timer = null;
    previousUnread = null;
    setBadge(0);
  }

  window.enableMarketAlerts = enableAlerts;
  window.mbStartAlerts = start;
  window.mbStopAlerts = stop;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && window.user) poll();
  });
})();