const test = require('node:test');
const assert = require('node:assert/strict');
const support = require('../api/support');

test('guest assistant uses a local answer and cannot spend the AI API key', async t => {
  const oldFetch = global.fetch;
  const oldKey = process.env.OPENAI_API_KEY;
  t.after(() => { global.fetch = oldFetch; if (oldKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = oldKey; });
  process.env.OPENAI_API_KEY = 'test-only';
  global.fetch = () => { throw new Error('Guest must not invoke paid services'); };
  const res = {
    code: 200,
    headers: {},
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; },
  };
  await support({ method: 'POST', url: '/api/assistant', query: { assistant: '1' }, body: { question: 'Сиыр бағасы қалай қойылады?' }, headers: { 'content-type': 'application/json' } }, res);
  assert.equal(res.code, 200);
  assert.equal(res.body.ok, true);
  assert.match(res.body.answer, /баға/i);
});
