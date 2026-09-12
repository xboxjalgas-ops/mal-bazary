const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const read = file => fs.readFileSync(file, 'utf8');

test('favorites are synchronized through an authenticated API', () => {
  const api = read('api/preferences.js');
  const app = read('js/app.js');
  const sql = read('supabase-engagement.sql');
  assert.match(api, /requireAuth/);
  assert.match(api, /user_id=eq\.\$\{auth\.id\}/);
  assert.match(app, /syncFavorites/);
  assert.match(sql, /primary key \(user_id, listing_id\)/);
  assert.match(sql, /enable row level security/);
});

test('browser alerts cover unread trade activity', () => {
  const alerts = read('js/notifications.js');
  const sw = read('service-worker.js');
  const html = read('market.html');
  assert.match(alerts, /Notification\.requestPermission/);
  assert.match(alerts, /offers/);
  assert.match(alerts, /reservations/);
  assert.match(sw, /SHOW_NOTIFICATION/);
  assert.match(html, /notificationToggle/);
});