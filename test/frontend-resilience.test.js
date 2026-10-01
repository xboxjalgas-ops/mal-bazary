const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const app=fs.readFileSync('js/app.js','utf8');
test('HTML escaping protects attribute quotes and markup',()=>{
  const context=vm.createContext({});
  vm.runInContext(app.slice(app.indexOf('function escapeHTML'),app.indexOf('/* ---------- PHONE MASK')),context);
  assert.equal(context.escapeHTML('"\'<> &'),'&quot;&#39;&lt;&gt; &amp;');
});
test('failed catalog requests retain existing data and report a retryable error',async()=>{
  const states=[];let renders=0;
  const context=vm.createContext({fetch:async()=>({ok:false,json:async()=>({ok:true,listings:[{id:'bad'}]})}),listings:[{id:'old'}],userProducts:[],window:{},normalizeListing:x=>x,normalizeProduct:x=>x,renderListings:()=>renders++,renderProducts:()=>{},catalogLoadMessage:(id,retry,failed)=>states.push({id,failed,retry})});
  vm.runInContext(app.slice(app.indexOf('async function loadListings'),app.indexOf('let user = null')),context);
  await context.loadListings();assert.equal(context.listings[0].id,'old');assert.equal(states.at(-1).failed,true);assert.equal(renders,1);
  context.fetch=async()=>({ok:true,json:async()=>({ok:true,listings:[{id:'new'}]})});
  await states.at(-1).retry();assert.equal(context.listings[0].id,'new');assert.equal(states.at(-1).failed,false);
});
test('wrong catalog response shapes and network failures are reported',async()=>{
  const states=[];
  const context=vm.createContext({fetch:async()=>({ok:true,json:async()=>({ok:true,products:null})}),userProducts:[{id:'old'}],window:{},normalizeListing:x=>x,normalizeProduct:x=>x,renderListings:()=>{},renderProducts:()=>{},catalogLoadMessage:(id,retry,failed)=>states.push(failed)});
  vm.runInContext(app.slice(app.indexOf('async function loadListings'),app.indexOf('let user = null')),context);
  await context.loadUserProducts();assert.equal(states.at(-1),true);assert.equal(context.userProducts[0].id,'old');
  context.fetch=async()=>{throw new Error('offline');};await context.loadUserProducts();assert.equal(states.at(-1),true);
});
test('theme initialization and switching work when browser storage throws',()=>{
  const document={documentElement:{dataset:{},setAttribute(name,value){this.dataset.theme=value;}},getElementById:()=>null};
  const context=vm.createContext({document,localStorage:{getItem(){throw Error('denied');},setItem(){throw Error('denied');}}});
  vm.runInContext(app.slice(app.indexOf('const THEME_KEY'),app.indexOf('/* ---------- ПРОФИЛЬ МОДАЛЫ')),context);
  context.initTheme();assert.equal(document.documentElement.dataset.theme,'light');
  context.toggleTheme();assert.equal(document.documentElement.dataset.theme,'dark');
});
test('language initialization and switching work when browser storage throws',()=>{
  const document={documentElement:{},body:{},querySelectorAll:()=>[],createTreeWalker:()=>({nextNode:()=>null}),addEventListener:()=>{}};
  const context=vm.createContext({document,NodeFilter:{SHOW_TEXT:4},localStorage:{getItem(){throw Error('denied');},setItem(){throw Error('denied');}}});
  vm.runInContext(fs.readFileSync('js/i18n.js','utf8'),context);context.setLanguage('ru');assert.equal(document.documentElement.lang,'ru');context.setLanguage('invalid');assert.equal(document.documentElement.lang,'kk');
});
