const test=require('node:test');
const assert=require('node:assert/strict');
const rules=require('../js/form-rules');
test('listing validates trimmed titles, finite positive prices and location before uploading',()=>{
  const valid={postTitle:'Меринос',postPrice:'123.50',postLoc:'Алматы'};
  assert.deepEqual(rules.validate('animal',valid),[]);
  for(const price of ['','0','-1','Infinity','1e10','oops'])assert.ok(rules.validate('animal',{...valid,postPrice:price}).some(e=>e.field==='postPrice'));
  assert.ok(rules.validate('animal',{...valid,postTitle:'  a  '}).some(e=>e.field==='postTitle'));
  assert.ok(rules.validate('animal',{...valid,postLoc:' '}).some(e=>e.field==='postRegion'));
});
test('product validation accepts unit pricing and rejects missing or oversized values',()=>{
  const valid={prodTitle:'Кувалда',prodPrice:'9 500 ₸ / дана',prodLoc:'Астана'};
  assert.deepEqual(rules.validate('product',valid),[]);
  assert.ok(rules.validate('product',{...valid,prodPrice:' '.repeat(20)}).some(e=>e.field==='prodPrice'));
  assert.ok(rules.validate('product',{...valid,prodDesc:'x'.repeat(1501)}).some(e=>e.code==='length'));
});
test('price range permits open bounds and zero, rejects negative or reversed ranges',()=>{
  for(const pair of [['',''],['0','0'],['','100'],['100',''],['50','100']])assert.ok(rules.priceRange(...pair));
  for(const pair of [['-1','100'],['100','50'],['NaN','100'],['0','Infinity']])assert.equal(rules.priceRange(...pair),false);
});
test('image checks reject oversized, empty and unsupported files',()=>{
  assert.equal(rules.imageProblem({type:'image/jpeg',size:4096}),null);
  assert.equal(rules.imageProblem({type:'image/png',size:4*1024*1024}),null);
  assert.equal(rules.imageProblem({type:'image/png',size:4*1024*1024+1}),'size');
  assert.equal(rules.imageProblem({type:'image/webp',size:0}),'size');
  assert.equal(rules.imageProblem({type:'image/svg+xml',size:4096}),'type');
});
test('draft excludes credentials, document identifiers, image data and unexpected keys',()=>{
  const draft=rules.cleanDraft({version:1,kind:'animal',fields:{postTitle:'Меринос',postDocuments:'private',images:'data:image/jpeg',access_token:'secret',postDesc:'x'.repeat(2000)}});
  assert.equal(draft.fields.postTitle,'Меринос');assert.equal(draft.fields.postDesc.length,1500);
  assert.deepEqual(Object.keys(draft.fields).sort(),['postDesc','postTitle']);
  for(const input of [null,[],{version:2,kind:'animal',fields:{}},{version:1,kind:'unknown',fields:{}}])assert.equal(rules.cleanDraft(input),null);
});
