const test=require('node:test');
const assert=require('node:assert/strict');
const catalog=require('../js/catalog-options');

test('15 product options are choices, not invented priced listings',()=>{
  assert.equal(catalog.products.length,15);
  assert.equal(new Set(catalog.products.map(x=>x.id)).size,15);
  assert.ok(catalog.products.some(x=>x.ru==='Кувалда'));
  for(const item of catalog.products){assert.ok(item.kk&&item.ru);assert.equal(item.category,'tag-coop');assert.equal(item.price,undefined);assert.equal(item.seller,undefined);}
});
test('breed choices match existing species and retain free-text compatibility',()=>{
  assert.ok(catalog.getBreeds('Қой').includes('Меринос'));
  assert.ok(catalog.getBreeds('Жылқы').includes('Көшім'));
  assert.deepEqual(catalog.getBreeds('unknown'),[]);
  const copy=catalog.getBreeds('Қой');copy.pop();assert.notDeepEqual(copy,catalog.getBreeds('Қой'));
  assert.ok(catalog.matchesBreed({animalDetails:{breed:'  МЕРИНОС '}},'Меринос'));
  assert.equal(catalog.matchesBreed({animalDetails:{breed:'Меринос'}},'Еділбай'),false);
  assert.ok(catalog.matchesBreed({},''));
});
test('product search covers description and location without changing input data',()=>{
  const product={name:'Кувалда',desc:'Стальная, 5 кг',loc:'Алматы'};
  assert.ok(catalog.matchesProduct(product,'  КУВАЛДА '));
  assert.ok(catalog.matchesProduct(product,'5 кг'));
  assert.ok(catalog.matchesProduct(product,'алматы'));
  assert.equal(catalog.matchesProduct(product,'седло'),false);
  assert.ok(catalog.matchesProduct(product,''));
  assert.equal(product.name,'Кувалда');
});
