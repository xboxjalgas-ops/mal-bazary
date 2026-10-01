const test=require('node:test');
const assert=require('node:assert/strict');
const {publicRow,withCatalogPrivacy}=require('../lib/catalog-privacy');
const {canManage,withOwnership}=require('../lib/ownership-guard');
const owner='11111111-1111-4111-8111-111111111111';
const other='22222222-2222-4222-8222-222222222222';
function response(){return {code:200,headers:{},status(code){this.code=code;return this;},setHeader(key,value){this.headers[key]=value;},json(body){this.body=body;return this;}};}

test('public catalog strips internal and future private columns and unknown animal detail keys',()=>{
  const row=publicRow({id:'a',title:'Меринос',seller_phone:'+77000000000',moderation_status:'approved',email:'private@example.test',access_token:'secret',internal_note:'private',animal_details:{breed:'Меринос',private_note:'secret'}},'listings');
  assert.equal(row.title,'Меринос');assert.equal(row.seller_phone,'+77000000000');
  for(const key of ['email','access_token','internal_note','moderation_status'])assert.equal(row[key],undefined);
  assert.deepEqual(row.animal_details,{breed:'Меринос'});
});
test('public response wrapper serializes the actual handler output and sets no-store',async()=>{
  const wrapped=withCatalogPrivacy(async(req,res)=>res.json({ok:true,products:[{name:'Кувалда',email:'private'}],debug:'private'}));
  const res=response();await wrapped({method:'GET',url:'/api/get-data',query:{type:'products'},headers:{}},res);
  assert.deepEqual(res.body,{ok:true,products:[{name:'Кувалда'}]});assert.equal(res.headers['Cache-Control'],'no-store');
});
test('catalog rejects unsupported methods and types without invoking backend',async()=>{
  let invoked=false;const wrapped=withCatalogPrivacy(()=>{invoked=true;});
  for(const [method,type,code] of [['POST','listings',405],['GET','users',400]]){
    const res=response();await wrapped({method,url:'/api/get-data',query:{type},headers:{}},res);assert.equal(res.code,code);
  }
  assert.equal(invoked,false);
});
test('ownership requires an account ID, not a matching phone; blocked admins are denied',()=>{
  const auth={id:owner,email:'owner@example.test'};
  assert.equal(canManage(auth,{role:'user'},{seller_auth_id:owner}),true);
  assert.equal(canManage(auth,{role:'user',phone:'same'},{seller_auth_id:other,seller_phone:'same'}),false);
  assert.equal(canManage(auth,{role:'user'},{seller_auth_id:null}),false);
  assert.equal(canManage(auth,{role:'admin',blocked:true},{seller_auth_id:owner}),false);
  assert.equal(canManage(auth,{role:'user'},{seller_auth_id:other},' OWNER@EXAMPLE.TEST '),true);
  assert.equal(canManage({id:owner,email:'xboxjalgas@gmail.com'},{role:'user'},{seller_auth_id:other}),false);
});
test('guard denies a different owner before original mutation handler runs',async t=>{
  const originalFetch=global.fetch;t.after(()=>{global.fetch=originalFetch;});
  let called=false;const requests=[];
  global.fetch=async url=>{requests.push(url);return {ok:true,json:async()=>url.includes('/auth/')?{id:owner,email:'owner@example.test'}:url.includes('/users?')?[{role:'user',blocked:false}]:[{seller_auth_id:other}]};};
  const res=response();await withOwnership(()=>{called=true;},'delete')({method:'POST',headers:{authorization:'Bearer test'},body:{kind:'listing',id:owner}},res);
  assert.equal(res.code,403);assert.equal(called,false);assert.equal(requests.length,3);
});
test('guard permits an owner and fails closed when ownership lookup fails',async t=>{
  const originalFetch=global.fetch;t.after(()=>{global.fetch=originalFetch;});
  for(const failure of [false,true]){
    let called=false;
    global.fetch=async url=>({ok:!failure||url.includes('/auth/'),json:async()=>url.includes('/auth/')?{id:owner}:url.includes('/users?')?[{role:'user'}]:[{seller_auth_id:owner}]});
    const res=response();await withOwnership(()=>{called=true;},'update')({method:'POST',headers:{authorization:'Bearer test'},body:{id:owner}},res);
    assert.equal(called,!failure);if(failure)assert.equal(res.code,503);
  }
});
test('unauthenticated and cross-site mutations never reach ownership queries',async t=>{
  const originalFetch=global.fetch;t.after(()=>{global.fetch=originalFetch;});
  global.fetch=()=>{throw new Error('unexpected query');};
  const handler=withOwnership(()=>{throw new Error('unexpected mutation');},'update');
  const res=response();await handler({method:'POST',headers:{},body:{id:owner}},res);assert.equal(res.code,401);
  const cross=response();await handler({method:'POST',headers:{origin:'https://other.test',host:'market.test'},body:{id:owner}},cross);assert.equal(cross.code,403);
});
