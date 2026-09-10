module.exports=async(req,res)=>{
 const type=req.query?.type||'listings',table=type==='products'?'products':'listings';
 const H={apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`};
 try{
  const r=await fetch(`${process.env.SUPABASE_URL}/rest/v1/${table}?select=*&order=created_at.desc&limit=200`,{headers:H});
  if(!r.ok)return res.status(502).json({ok:false,message:'Дерекқор қатесі'});const data=await r.json();
  const ids=[...new Set(data.map(x=>x.seller_auth_id).filter(Boolean))];let profiles=[],reviews=[];
  if(ids.length){
   const filter=`in.(${ids.join(',')})`;
   const [pr,rr]=await Promise.all([
    fetch(`${process.env.SUPABASE_URL}/rest/v1/users?select=auth_user_id,shop_name,verified&auth_user_id=${filter}`,{headers:H}),
    fetch(`${process.env.SUPABASE_URL}/rest/v1/reviews?select=seller_id,rating&seller_id=${filter}`,{headers:H})
   ]);profiles=pr.ok?await pr.json():[];reviews=rr.ok?await rr.json():[];
  }
  const enriched=data.map(x=>{const p=profiles.find(y=>y.auth_user_id===x.seller_auth_id)||{};const rv=reviews.filter(y=>y.seller_id===x.seller_auth_id);return {...x,seller_verified:Boolean(p.verified),seller_shop_name:p.shop_name||'',seller_rating:rv.length?Number((rv.reduce((s,y)=>s+Number(y.rating),0)/rv.length).toFixed(1)):0,seller_review_count:rv.length};});
  return res.status(200).json({ok:true,[table==='products'?'products':'listings']:enriched});
 }catch{return res.status(500).json({ok:false,message:'Серверде қате'});}
};
