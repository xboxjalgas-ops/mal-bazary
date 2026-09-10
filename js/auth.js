const SUPABASE_URL = 'https://wqjkvkmowxswhdmgjsfd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_7uOfQCTe99tKVw9diBSbKw_Q8ChK_kv';
const AUTH_KEY = 'mb_supabase_auth';

function authSession(){ try{return JSON.parse(localStorage.getItem(AUTH_KEY)||'null');}catch{return null;} }
function saveAuth(data){
  const s={access_token:data.access_token,refresh_token:data.refresh_token,expires_at:Date.now()+(Number(data.expires_in||3600)*1000)};
  localStorage.setItem(AUTH_KEY,JSON.stringify(s)); return s;
}
function clearAuth(){ localStorage.removeItem(AUTH_KEY); }
async function supabaseRequest(path,options={}){
  const headers={apikey:SUPABASE_KEY,'Content-Type':'application/json',...(options.headers||{})};
  return fetch(`${SUPABASE_URL}${path}`,{...options,headers});
}
async function refreshAuth(){
  const s=authSession(); if(!s?.refresh_token)return null;
  try{const r=await supabaseRequest('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:s.refresh_token})});if(!r.ok){clearAuth();return null;}return saveAuth(await r.json());}catch{return null;}
}
async function validAuth(){
  let s=authSession(); if(!s)return null;
  if(Date.now()>s.expires_at-60000)s=await refreshAuth();
  return s;
}
async function authAccessToken(){return (await validAuth())?.access_token||'';}
function signInWithGoogle(){
  const redirect=`${location.origin}${location.pathname}`;
  location.href=`${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirect)}`;
}
async function sendEmailOtp(email){
  return supabaseRequest('/auth/v1/otp',{method:'POST',body:JSON.stringify({email,create_user:true})});
}
async function verifyEmailOtp(email,token){
  const r=await supabaseRequest('/auth/v1/verify',{method:'POST',body:JSON.stringify({email,token,type:'email'})});
  if(r.ok)saveAuth(await r.json()); return r;
}
function consumeOAuthHash(){
  const p=new URLSearchParams(location.hash.slice(1));
  if(!p.get('access_token'))return false;
  saveAuth({access_token:p.get('access_token'),refresh_token:p.get('refresh_token'),expires_in:p.get('expires_in')});
  history.replaceState(null,'',location.pathname+location.search); return true;
}
async function getAuthIdentity(){
  const s=await validAuth(); if(!s)return null;
  const r=await supabaseRequest('/auth/v1/user',{headers:{Authorization:`Bearer ${s.access_token}`}});
  if(!r.ok){clearAuth();return null;} return r.json();
}
async function signOutAuth(){
  const s=authSession(); if(s?.access_token)await supabaseRequest('/auth/v1/logout',{method:'POST',headers:{Authorization:`Bearer ${s.access_token}`}}).catch(()=>{});
  clearAuth();
}
