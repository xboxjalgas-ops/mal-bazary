const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

// Execute the actual favorites functions without starting the page or requesting live data.
const app = fs.readFileSync('js/app.js', 'utf8');
const source = app.slice(app.indexOf('const FAVORITES_KEY'), app.indexOf('async function syncFavorites'));
function favorites(storage) {
  const context = vm.createContext({ localStorage: storage });
  vm.runInContext(source, context);
  return context;
}
const read = context => Array.from(context.getFavorites());

test('invalid JSON and valid JSON of the wrong type produce an empty favorites list', () => {
  for (const value of ['{broken', 'null', '{}', '42', '"listing"', 'true']) {
    const context = favorites({ getItem: () => value });
    assert.deepEqual(read(context), []);
    assert.equal(context.isFavorite('1'), false);
  }
});

test('legacy numeric IDs are normalized, duplicates and invalid values are removed', () => {
  const context = favorites({ getItem: () => '[7,"7"," uuid ",null,{},[],true,"",-1,1.5]' });
  assert.deepEqual(read(context), ['7', 'uuid']);
  assert.equal(context.isFavorite(7), true);
});

test('favorites persist across page instances', () => {
  let stored = null;
  const storage = { getItem: () => stored, setItem: (key, value) => { stored = value; } };
  assert.equal(favorites(storage).saveFavorites(['a', 'a', 7]), true);
  assert.deepEqual(read(favorites(storage)), ['a', '7']);
});

test('blocked storage keeps a temporary list without throwing', () => {
  const context = favorites({ getItem() { throw new Error('SecurityError'); }, setItem() { throw new Error('SecurityError'); } });
  assert.deepEqual(read(context), []);
  assert.equal(context.saveFavorites(['a']), false);
  assert.deepEqual(read(context), ['a']);
  context.saveFavorites([]);
  assert.deepEqual(read(context), []);
});

test('quota failures do not restore stale values; persistence can recover', () => {
  let stored = '["old"]';
  let blocked = true;
  const context = favorites({ getItem: () => stored, setItem(key, value) {
    if (blocked) throw new Error('QuotaExceededError');
    stored = value;
  } });
  assert.equal(context.saveFavorites(['new']), false);
  assert.deepEqual(read(context), ['new']);
  blocked = false;
  assert.equal(context.saveFavorites(context.getFavorites()), true);
  assert.equal(stored, '["new"]');
  stored = '["another-tab"]';
  assert.deepEqual(read(context), ['another-tab']);
});
