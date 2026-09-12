const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = file => fs.readFileSync(file, 'utf8');

test('experience pack is loaded on every main surface', () => {
  for (const file of ['index.html', 'market.html', 'listing.html', 'admin.html']) {
    assert.match(read(file), /js\/experience\.js/);
  }
});

test('experience pack includes resilient feedback and reduced-motion support', () => {
  const js = read('js/experience.js');
  const css = read('css/style.css');
  assert.match(js, /mbSkeleton/);
  assert.match(js, /mbUploadProgress/);
  assert.match(js, /navigator\.onLine/);
  assert.match(js, /mb-backtop/);
  assert.match(css, /mb-page-curtain/);
  assert.match(css, /mb-skeleton-card/);
  assert.match(css, /prefers-reduced-motion/);
});

test('offline shell caches the experience layer', () => {
  const sw = read('service-worker.js');
  assert.match(sw, /mal-bazary-v9/);
  assert.match(sw, /js\/experience\.js/);
});